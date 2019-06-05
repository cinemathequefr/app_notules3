const _ = require("lodash");
const execQuery = require("../exec_query");
const config = require("../config");
const queries = require("../queries");
const helpers = require("../helpers");
const format = require("../format");
const turndownService = new require("turndown")(config.turndown);

async function getConfsFromCats(db, idCats, idProg) {
  let confs = await execQuery.single(db, queries.confsFromCats, [
    idCats,
    idProg
  ]);
  confs = _(confs)
    .map(d => helpers.keysToCamel(d))
    .map(d =>
      _({})
      .assign(d, {
        titre: format.cudm(d.titre)
      })
      .value()
    )
    .groupBy("idEvenement")
    .mapValues(d => d[0])
    .value();
  return confs;
}

async function getConfsTextesFromCats(db, idCats, idProg) {
  let confsTextes = await execQuery.single(db, queries.confsTextesFromCats, [
    idCats,
    idProg
  ]);

  confsTextes = _(confsTextes)
    .map(d => helpers.keysToCamel(d))
    .filter(d => _.kebabCase(d.texte) !== "") // Retire les textes sans contenu réel
    .groupBy("idEvenement")
    .mapValues(d => {
      return {
        textes: _(d)
          .map(f => {
            return {
              typeTexte: f.typeTexte,
              texte: format.stripNewLines(
                // Retire les sauts de ligne à l'intérieur d'un texte
                turndownService.turndown(format.cudm(f.texte))
              )
            };
          })
          .value()
      };
    })
    .value();

  return confsTextes;
}

module.exports = async function (db, cycleConfig) {
  let idCats = helpers.getIdCats(cycleConfig);
  let idProg = cycleConfig.idProg;

  try {
    var confs = await getConfsFromCats(db, idCats, idProg);
    var confsTextes = await getConfsTextesFromCats(db, idCats, idProg);
  } catch (e) {
    console.error(e);
  }

  let confsMerge = _.merge(confs, confsTextes);
  confsMerge = _(confsMerge).map().value();

  return confsMerge;
};



/*
async function getFilmsTextesFromCats(db, idCats, idProg) {
  let filmsTextes = await execQuery.single(db, queries.filmsTextesFromCats, [
    idCats,
    idProg
  ]);
  filmsTextes = _(filmsTextes)
    .map(d => helpers.keysToCamel(d))
    .filter(d => _.kebabCase(d.texte) !== "") // Retire les textes sans contenu réel
    .groupBy("idFilm")
    .mapValues(d => {
      return {
        textes: _(d)
          .map(f => {
            return {
              typeTexte: f.typeTexte,
              texte: format.stripNewLines(
                // Retire les sauts de ligne à l'intérieur d'un texte
                turndownService.turndown(format.cudm(f.texte))
              )
            };
          })
          .value()
      };
    })
    .value();
  return filmsTextes;
}

async function getFilmsGeneriquesFromCats(db, idCats, idProg) {
  let filmsGeneriques = await execQuery.single(
    db,
    queries.filmsGeneriquesFromCats,
    [idCats, idProg]
  );
  filmsGeneriques = _(filmsGeneriques)
    .map(d => helpers.keysToCamel(d))
    // .filter(d => d.fonction === 32) // Filtrage pour conserver uniquement la fonction interpète (désactiver pour la requête modifiée)
    .orderBy(d => d.ordre)
    .groupBy(d => d.idFilm)
    .mapValues(d => {
      return {
        generique: _(d)
          .take(4)
          .map(f => format.formatName(f.prenom, f.particule, f.nom))
          .value()
      };
    })
    .value();

  return filmsGeneriques;
}

async function getFilmsAdaptationsFromCats(db, idCats, idProg) {
  let filmsAdaptations = await execQuery.single(
    db,
    queries.filmsAdaptationsFromCats,
    [idCats, idProg]
  );

  filmsAdaptations = _(filmsAdaptations)
    .map(d => helpers.keysToCamel(d))
    .groupBy("idFilm")
    .mapValues(d => {
      return {
        adaptation: format
          .beforeAfterStr(
            "",
            ".",
            _(d)
              .groupBy("mention")
              .map(c => {
                let auteurs = format.joinLast(
                  " , ",
                  " et ",
                  _(c)
                    .map(b => format.formatName(b.prenom, b.particule, b.nom))
                    .value()
                );
                return (
                  _.upperFirst(c[0].mention) +
                  " " +
                  format.de(auteurs) +
                  auteurs
                );
              })
              .value()
              .join(`.  \n`)
          )
          .replace(/\"([^\"]+)\"/gi, "_$1_") // Remplace les guillemets des titres par l'italique markdown `_`
      };
    })
    .value();

  return filmsAdaptations;
}

module.exports = async function(db, cycleConfig) {
  let idCats = helpers.getIdCats(cycleConfig);
  let idProg = cycleConfig.idProg;

  try {
    var films = await getconfsFromCats(db, idCats, idProg);
    var filmsTextes = await getFilmsTextesFromCats(db, idCats, idProg);
    var filmsGeneriques = await getFilmsGeneriquesFromCats(db, idCats, idProg);
    var filmsAdaptations = await getFilmsAdaptationsFromCats(
      db,
      idCats,
      idProg
    );
  } catch (e) {
    console.error(e);
  }

  let filmsMerged = _.merge(
    films,
    filmsTextes,
    filmsGeneriques,
    filmsAdaptations
  );
  filmsMerged = _(filmsMerged)
    .map()
    .orderBy(d => _.kebabCase(d.titre))
    .value();
  return filmsMerged;
};
*/