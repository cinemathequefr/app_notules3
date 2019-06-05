const _ = require("lodash");

/**
 * mergeFilmsSeances
 * @description
 * Fusionne les données de films et de séances d'un cycle (aka _MERGE).
 * @param {Object} cycleConfig Objet de configuration du cycle : { idProg, idCycleProg, titreCycle, sousCycles: [{ titre, cats: [], tri }]}.
 * @param {Array} films Données : films du cycle (aka _FILMS)
 * @param {Array} seances Données : séances du cycle (aka _SEANCES)
 * @returns {Object} Objet {data, info} : les données de cycle fusionnées, et (TODO) des informations sur le déroulement de la fusion (en particulier s'il faut patcher les films).
 */
function mergeFilmsSeances(cycleConfig, films, seances) {
  let filmsInSeances = _(seances)
    .map(d =>
      _(d.items)
      .map(e => e.idFilm)
      .value()
    )
    .flatten()
    .uniq()
    .sort()
    .value();

  let filmsInFilms = _(films)
    .map(d => d.idFilm)
    .sort()
    .value();

  let cycle = []; // Données du cycle = fusion des séances dans les films.
  let info = {}; // Informations renvoyées par l'opération (cohérence, id de films à compléter).

  // Vérification de la cohérence des deux fichiers avant fusion
  // Note: Cette vérification est nécessaire car le fichier films.json sera généralement généré (pour corrections)
  // bien avant le fichier seances.json.
  // Il faudra pouvoir mettre à jour film.json en ajoutant (ou retirant) des films pour retrouver la cohérence avec les séances.
  console.log(`Les données films contiennent ${filmsInFilms.length} films.`);
  console.log(
    `Les données séances référencent ${filmsInSeances.length} films.`
  );

  let diffFilmsSeances = _.difference(filmsInFilms, filmsInSeances);
  let diffSeancesFilms = _.difference(filmsInSeances, filmsInFilms);

  if (diffFilmsSeances.length === 0 && diffSeancesFilms.length === 0) {
    console.log("Ces données sont cohérentes.");
  } else {
    console.log("Les données ne sont pas cohérentes");
    if (diffFilmsSeances.length > 0) {
      // Cas bénin, il suffit d'ignorer les films concernés
      console.log(
        `Aucune séance n'a été trouvée pour les films suivants : ${diffFilmsSeances.join(
          ", "
        )}`
      );
    }
    if (diffSeancesFilms.length > 0) {
      // Il faudra pouvoir patcher films.json avec les données manquantes
      console.log(
        `Les films suivants ont des séances mais pas de données les concernant : ${diffFilmsSeances.join(
          ", "
        )}`
      );
    }
  }

  // Séances : on crée une entrée par item de séance combinant en-tête + données d'item.
  seances = _(seances)
    .map(d => {
      let header = _(d)
        .omit("items")
        .value();
      return _(d.items)
        .map(e =>
          _({})
          .assign(e, header)
          .value()
        )
        .value();
    })
    .flatten()
    .value();

  films = _(films)
    .groupBy("idFilm")
    .mapValues(e => e[0])
    .value();

  seances = _(seances)
    .groupBy("idFilm")
    .mapValues(e => {
      return {
        seance: e
      };
    })
    .value();

  cycle = _.merge(films, seances);

  cycle = _(cycle)
    .map(d =>
      _({})
      .assign({
        idCategorie: _(d)
          .thru(e => {
            try {
              return e.seance[0].idCategorie;
            } catch (err) {
              return null;
            }
          })
          .value()
      }, d)
      .value()
    )
    .value();

  // Répartition par sous-cycle (en suivant l'ordre indiqué par cycleConfig)
  cycle = _(cycleConfig.sousCycles)
    .map(d => {
      return {
        titreSousCycle: d.titre,
        tri: d.tri,
        items: _(d.cats)
          .map(
            e =>
            _(cycle)
            .groupBy("idCategorie")
            .value()[e]
          )
          .filter(e => !_.isUndefined(e))
          .flatten()
          .orderBy("titre")
          .value()
      };
    })
    .value();

  cycle = _(cycle)
    .map(d =>
      _({}).assign(d, {
        items: _(d.items)
          .map(e =>
            _(e.seance)
            .map(f =>
              _({})
              .assign(
                f,
                _(e)
                .pick([
                  "titre",
                  "art",
                  "titreVo",
                  "artVo",
                  "realisateurs",
                  "annee",
                  "pays",
                  "generique",
                  "adaptation",
                  "textes"
                ])
                .value()
              )
              .value()
            )
            .value()
          )
          .sortBy("titre", "dateHeure")
          .flatten()
          .value()
      }).value())
    .value();

  return {
    data: cycle,
    info: info
  };
}

module.exports = mergeFilmsSeances;