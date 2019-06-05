const _ = require("lodash");
const moment = require("moment");
const format = require("../format.js");

moment.locale("fr", require("../config.js").momentLocale.fr);


const temp = _.template(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?aid style="50" type="snippet" readerVersion="6.0" featureSet="257" product="8.0(370)" ?>
<?aid SnippetType="InCopyInterchange"?>
<Document DOMVersion="8.0" Self="d">
  <Story Self="story">
  <% _.forEach(data.data, sousCycle => { %>
    <ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/$ID/CATEGORIE">
      <Content><%= sousCycle.titreSousCycle %></Content>
    </ParagraphStyleRange>
  <% }); %>
 </Story>
</Document>`);


// const temp = _.template(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <?aid style="50" type="snippet" readerVersion="6.0" featureSet="257" product="8.0(370)" ?>
// <?aid SnippetType="InCopyInterchange"?>
// <Document DOMVersion="8.0" Self="d">
// <Story Self="story">
// <!--<Story Self="story" TrackChanges="false" StoryTitle="" AppliedTOCStyle="n" AppliedNamedGrid="n">-->
// <!--<StoryPreference OpticalMarginAlignme nt="true" OpticalMarginSize="12" />-->
// <% _.forEach(data.data, sousCycle => { %>
// <ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/$ID/CATEGORIE">
//   <Content><%= sousCycle.titreSousCycle %></Content>
//   <Br />
// </ParagraphStyleRange>


// <% _.forEach(sousCycle.items, film => { %>
// <ParagraphStyleRange AppliedParagraphStyle="ParagraphStyle/$ID/TITRE">
// <Content><%= format.artTitre(film.art, film.titre) %></Content>
// <Br />
// </ParagraphStyleRange>
// <!--
// <%= ba("**(", ")**¤", format.artTitre(film.artVo, film.titreVo)) %>
//   <%= ba("", "¤", format.de(film.realisateurs) + film.realisateurs) %>
//   <%= ba("", "¤", format.join(" / ", [film.pays, film.annee, ba("", " min", film.duree), film.version, film.format])) %>
//   <%= ba("", "¤", film.adaptation) %>
//   <%= ba("Avec ", ".¤", format.join(", ", film.generique)) %>
//   <% _.forEach(film.textes, texte => {
//     let t = texte.texte;
//     if (texte.typeTexte === 203) t = "[JP] " + t;
//     %>
//     <%= ba("", "¤", t) %>
//   <% }) %>
//   <%= ba("", "¤", film.precedeSuivi) %>
//   ¤
//   <% _.forEach(film.seance, seance => { %>
//     - <%= ba("", "¤", format.join(" ", [moment(seance.dateHeure).format("ddd D MMM HH[h]mm"), seance.idSalle[0]])) %>
//     <%= ba("", "¤", seance.mention) %>
//     <%= ba("", "¤", seance.precedeSuivi) %>
//   <% }) %>
//   ¤¤
// -->

//   <% }) %>







// <% }) %>
// </Story>
// </Document>`);


function icml(data) {
  let o = temp({
    data: data,
    format: format,
    moment: moment,
    ba: format.beforeAfterStr // Raccourci
  });

  return o;
}


module.exports = icml;