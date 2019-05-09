const fs = require("fs");
const _ = require("lodash/fp");
const helpers = require("./lib/helpers.js");
const {
  promisify
} = require("util"); // https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await

const fp = _.noConflict();
const mkdir = promisify(fs.mkdir);

const glob = promisify(require("glob"));

const pathToData = {
  local: "./data/",
  remote: "//constellation2/celluleweb/publications/"
};

let progConfig = {};
let progFullCode = "";

try {
  let args = helpers.extractArgsValue(process.argv.slice(2).join(" "));
  var idProg = helpers.toNumOrNull(args.p[0]);
} catch (e) {
  console.error("Erreur d'arguments. Un argument est requis : -p <id programme>.");
}

(async () => {
  try {
    progConfig = await helpers.readFileAsJson(`./config/PROG${idProg}.json`);
    progFullCode = `PROG${idProg} ${!_.isUndefined(progConfig.titre) ? progConfig.titre.toString() : ""}` // Code de la programmation, eg. "PROG60 Juin-juillet 2019"
  } catch (e) {
    console.log(e);
  }

  // Création des répertoires sur local et remote
  fp.forEach(async (p) => {
    try {
      await mkdir(`${p}${progFullCode}`);
      console.log(`OK : Le répertoire "${progFullCode}" a été créé dans ${p}.`);
    } catch (e) {
      if (e.errno === -4075) {
        console.log(`Erreur : Le répertoire "${progFullCode}" existe déjà dans ${p}`);
      } else {
        console.log(e);
      }
    }
  })(pathToData);

  // TEST: identification du répertoire d'après son seul idProg (erreur s'il n'y en a pas exactement 1).
  fp.forEach(async (p) => {
    try {
      let dirs = await glob(`/PROG${idProg}*`, {
        root: p
      });

      if (dirs.length === 0) throw new Error(`Erreur : Aucun répertoire ne correspond au pattern "PROG${idProg}".`);
      if (dirs.length > 1) throw new Error(`Erreur : Plusieurs répertoires correspondent au pattern "PROG${idProg}".`);
      console.log(`OK : Un répertoire correspond au pattern "PROG${idProg}" : ${dirs[0]}.`);
    } catch (e) {
      console.log(e.message);
    }
  })(pathToData);

})();