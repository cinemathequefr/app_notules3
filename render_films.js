const fs = require("fs");
const _ = require("lodash");
const cheerio = require("cheerio");
const helpers = require("./lib/helpers.js");
const format = require("./lib/format.js");
const config = require("./lib/config.js");
const markdownFilms = require("./lib/transforms/markdown_films.js");
const scraper = require("./lib/scraper.js");
const turndownService = new require("turndown")({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "indented",
  emDelimiter: "_",
  strongDelimiter: "**"
});

try {
  let args = helpers.extractArgsValue(process.argv.slice(2).join(" "));
  var idProg = helpers.toNumOrNull(args.p[0]);
  var idCycle = helpers.toNumOrNull(args.c[0]);
  var isDef = !_.isUndefined(args.d);
} catch (e) {
  console.error(
    "Erreur d'arguments. Les arguments attendus sont de la forme : -p <id programme> -c <id cycle> -d (optionnel)."
  );
}

(async function () {
  let progConfig = await helpers.fetchProgConfig(idProg);
  let cycleConfig = helpers.cycleConfig(progConfig, idCycle);
  let progDirectoryName = helpers.getFullCode.prog(progConfig).join(" "); // Nom du répertoire du programme
  let cycleFullCode = helpers.getFullCode.cycle(progConfig, idCycle);

  let films;

  if (isDef === false) {
    films = await helpers.readFileAsJson(`${config.pathData.local}${progDirectoryName}/${cycleFullCode[0]}_FILMS ${cycleFullCode[1]}.json`);
  } else {
    films = await helpers.readFileAsJson(`${config.pathData.remote}${progDirectoryName}/${cycleFullCode[0]} ${cycleFullCode[1]}/${cycleFullCode[0]}_FILMS_DEF ${cycleFullCode[1]}.json`);
  }

  films = _(films).sortBy(d => _.kebabCase(d.titre)).value(); // Important quand isDef===true car l'ordre des films peut être devenu incorrect avec la correction d'un titre

  if (isDef === false) {
    let filmsSite = await filmsFromSite(films); // Récupère les synopsis des films sur le site
    films = _(
        _.merge(
          _(films)
          .groupBy("idFilm")
          .mapValues(e => e[0])
          .value(),
          filmsSite
        )
      )
      .map()
      .orderBy(d => _.kebabCase(d.titre))
      .value();
  }

  let md = markdownFilms({
    header: cycleConfig,
    data: films
  });

  if (isDef === false) {
    await helpers.writeFileInFolder(
      `${config.pathData.remote}${progDirectoryName}`,
      `${cycleFullCode[0]} ${cycleFullCode[1]}`, // Répertoire éventuellement à créer
      `${cycleFullCode[0]}_FILMS ${cycleFullCode[1]}.md`,
      md,
      "utf8"
    );
  } else {
    await helpers.writeFileInFolder(
      `${config.pathData.remote}${progDirectoryName}`,
      `${cycleFullCode[0]} ${cycleFullCode[1]}`, // Répertoire éventuellement à créer
      `${cycleFullCode[0]}_FILMS_DEF_FINAL ${cycleFullCode[1]}.md`,
      md,
      "utf8"
    );
  }


})();

// Scrape les pages film du site.
async function filmsFromSite(films) {
  let args = _(films)
    .map(f => [`http://www.cinematheque.fr/film/${f.idFilm}.html`, f.idFilm])
    .unzip()
    .value();
  let o = scraper.filterOK(await scraper.scrape(...args));

  o = _(o)
    .mapValues(v => {
      if (!!v) {
        let $ = cheerio.load(v);
        let text = $(".synopsys").html();
        return typeof text === "string" ?
          format.cudm(
            turndownService.turndown(text).replace(/(\r\n|\n|\r)/gi, " ")
          ) :
          "";
      } else {
        return null;
      }
    })
    .value();

  // Place le texte dans une propriété texteSite.
  o = _(o)
    .mapValues(v => {
      return {
        texteSite: v
      };
    })
    .value();

  return o;
}