import wtf from "./lib/wtf_wikipedia-client.mjs";

export class WikiImporter {
  static ID = "wiki-import";

  static log(force, ...args) {
    const shouldLog =
      force ||
      game.modules.get("_dev-mode")?.api?.getPackageDebugValue(this.ID);

    if (shouldLog) {
      console.log(this.ID, "|", ...args);
    }
  }

  static FLAGS = {
    WIKI_IMPORT: "wiki-import",
    DOMAIN: "domain"
  };

  static SETTINGS = {
    INFOBOXES: "infoboxes",
    DOWNLOAD_IMAGES: "downloadImages",
    USE_QUICK_INSERT: "useQuickInsert"
  };

  static indexingPromise = null;

  static async fetchPage(url) {
    ui.notifications.info(
      game.i18n.localize(`${WikiImporter.ID}.progress.startFetch`)
    );
    addCustomInfoBoxes();
    const doc = await wtf.fetch(url);
    return docToJournal(doc);
  }

  static async convertSource(source, domain) {
    ui.notifications.info(
      game.i18n.localize(`${WikiImporter.ID}.progress.startConvert`)
    );
    addCustomInfoBoxes();
    const doc = wtf(source, {
      domain: domain || "wikipedia.org"
    });
    return docToJournal(doc);
  }
}

const ignoredInfoBoxFields = ["image_capt", "regionmap", "latlong"];

wtf.extend((models, templates, infoboxes) => {
  Object.assign(infoboxes, {
    //PF
    ["abyssal realm"]: true,
    accessory: true,
    adventure: true,
    ["alchemical item"]: true,
    ["arcane school"]: true,
    audio: true,
    biography: true,
    book: true,
    city: true,
    class: true,
    company: true,
    cosmos: true,
    creature: true,
    deck: true,
    deity: true,
    domain: true,
    ["hellknight orders"]: true,
    ["magic item"]: true,
    map: true,
    miniatures: true,
    nation: true,
    organization: true,
    person: true,
    ["planar vehicle"]: true,
    plane: true,
    ["prestige class"]: true,
    region: true,
    ship: true,
    spell: true,
    ["technological item"]: true,
    vehicle: true,

    //Wikipedia
    instrument: true
  });
});

function orderParagraphsAndTables(doc, section) {
  const result = [];
  for (const table of section.tables()) {
    table.order = doc.wikitext().indexOf(table.wikitext());
    table.elementType = "table";
    result.push(table);
  }
  for (const paragraph of section.paragraphs()) {
    paragraph.order = 0;
    for (const sentence of paragraph.sentences()) {
      let order = doc.wikitext().indexOf(sentence.wikitext());
      if (order >= 0) {
        paragraph.order = order;
        break;
      }
    }
    paragraph.elementType = "paragraph";
    result.push(paragraph);
  }
  return result.sort((a, b) => a.order - b.order);
}

async function addParagraphsAndTables(orderedItems) {
  let result = "";
  for (const item of orderedItems) {
    if (item.elementType === "paragraph") {
      result += await addParagraph(item);
    } else {
      result += await addTable(item);
    }
  }
  return result;
}

async function docToJournal(doc) {
  if (self.QuickInsert && !(QuickInsert.hasIndex ?? QuickInsert.searchLib?.index)) {
    if (
      game.settings.get(WikiImporter.ID, WikiImporter.SETTINGS.USE_QUICK_INSERT)
    ) {
      if (!WikiImporter.indexingPromise) {
        ui.notifications.info(
          game.i18n.localize(`${WikiImporter.ID}.quickInstert.reindexStart`)
        );
        WikiImporter.indexingPromise = QuickInsert.forceIndex();
        await WikiImporter.indexingPromise;
        delete WikiImporter.indexingPromise;
        ui.notifications.info(
          game.i18n.localize(`${WikiImporter.ID}.quickInstert.reindexComplete`)
        );
      } else {
        await WikiImporter.indexingPromise;
      }
    }
  }

  let result = "";
  for (const section of doc.sections()) {
    if (
      section.title().length > 0 &&
      section.title().toLowerCase() !== "references"
    ) {
      result += header(section.title(), section.depth());
    }
    result += "<div>";
    if (section.infoboxes().length + section.images().length > 0) {
      result += '<div style="width: 50%; float: right; margin-left: 15px;">';
      result += await addInfoBoxes(section.infoboxes());
      result += await addImages(section.images());
      result += "</div>";
    }
    const orderedItems = orderParagraphsAndTables(doc, section);
    result += await await addParagraphsAndTables(orderedItems);
    result += await addLists(section.lists());
    result += "</div>";
  }

  const downloadImages = game.settings.get(
    WikiImporter.ID,
    WikiImporter.SETTINGS.DOWNLOAD_IMAGES
  );

  for (const image of doc.images()) {
    let resultPath = null;
    if (downloadImages) {
      resultPath = await downloadImage(image);
    }

    if (!resultPath || !downloadImages) {
      result = result.replace(
        image.data.file,
        getImageString(image, image.url(), image.file())
      );
    } else {
      result = result.replace(
        image.data.file,
        getImageString(image, resultPath)
      );
    }
  }

  ui.notifications.info(
    game.i18n.localize(`${WikiImporter.ID}.progress.complete`)
  );
  return result;
}

function addCustomInfoBoxes() {
  let customInfoBoxes = game.settings.get(
    WikiImporter.ID,
    WikiImporter.SETTINGS.INFOBOXES
  );
  if (customInfoBoxes) {
    let splitBoxes = customInfoBoxes
      .toLowerCase()
      .split(";")
      .filter(infobox => infobox.length > 0);
    let newBoxes = {};
    for (const splitBox of splitBoxes) {
      newBoxes[splitBox] = true;
    }
    wtf.extend((models, templates, infoboxes) => {
      Object.assign(infoboxes, newBoxes);
    });
  }
}

export async function downloadImage(image) {
  if (
    !(await FilePicker.browse("data", `wiki-import`)).dirs.find(
      d => d === `wiki-import/${image.data.domain}`
    )
  ) {
    await FilePicker.createDirectory(
      "data",
      `wiki-import/${image.data.domain}`
    );
  }

  if (
    !(await FilePicker.browse(
      "data",
      `wiki-import/${image.data.domain}`
    )).files.find(f => f === image.file())
  ) {
    try {
      const response = await fetch(image.url());

      await FilePicker.upload(
        "data",
        `wiki-import/${image.data.domain}`,
        new File([await response.blob()], image.file())
      );
    } catch (e) {
      WikiImporter.log(false, `Could not download image ${image.url()}`, e);
      return;
    }
  }

  return `wiki-import/${image.data.domain}/${image.file()}`;
}

async function addImages(images) {
  let result = '<div style="margin-left: auto; margin-right: 0;">';
  const downloadImages = game.settings.get(
    WikiImporter.ID,
    WikiImporter.SETTINGS.DOWNLOAD_IMAGES
  );

  for (const image of images) {
    let resultPath = null;
    if (downloadImages) {
      resultPath = await downloadImage(image);
    }

    if (!resultPath || !downloadImages) {
      result += getImageString(image, image.url());
    } else {
      result += getImageString(image, resultPath);
    }
  }
  result += "</div>";
  return result;
}

function getImageString(image, path) {
  let isVideo = image.data.file.endsWith("webm");
  let result = "";
  if (isVideo) {
    result += "<div>";
  }
  result += `<${isVideo ? "video autoplay" : "img"} src="${path}">`;
  if (isVideo) {
    result += "</div>";
  }
  return result;
}

async function addInfoBoxes(infoBoxes) {
  let result = "";
  for (const infoBox of infoBoxes) {
    let infoBoxText = '<table border="1"><tbody>';
    for (const key of Object.keys(infoBox.data)) {
      if (!ignoredInfoBoxFields.includes(key)) {
        infoBoxText += `<tr><td style="width: 30%;">${key}</td><td>${await addSentence(
          infoBox.data[key]
        )}</td></tr>`;
      }
    }
    infoBoxText += "</tbody></table>";
    result += infoBoxText;
  }
  return result;
}

async function addTable(table) {
  if (table.data.length > 0) {
    let tableText = '<table border="1"><thead><tr>';
    for (const key of Object.keys(table.data[0])) {
      tableText += `<td scope="col">${key}</td>`;
    }
    tableText += "</tr></thead><tbody>";
    for (const row of table.data) {
      tableText += "<tr>";
      for (const cell of Object.values(row)) {
        tableText += `<td>${await addSentence(cell)}</td>`;
      }
      tableText += "</tr>";
    }
    tableText += "</tbody></table>";
    return tableText;
  } else {
    return "";
  }
}

async function addLists(lists) {
  let result = "";
  for (const list of lists) {
    if (list.data.length > 0) {
      let listText = "<ul>";
      for (const sentence of list.data) {
        listText += `<li>${await addSentence(sentence)}</li>`;
      }
      result += `${listText}</ul>`;
    }
  }
  return result;
}

async function addParagraph(paragraph) {
  let paragraphText = "";
  for (const sentence of paragraph.sentences()) {
    paragraphText += await addSentence(sentence);
  }
  if (paragraphText.length > 0) {
    return `<p>${paragraphText}</p>`;
  } else {
    return "";
  }
}

async function addSentence(sentence) {
  let sentenceText = sentence.text() + " ";
  for (const bold of sentence.bolds()) {
    sentenceText = sentenceText.replace(bold, `<b>${bold}</b>`);
  }
  for (const italic of sentence.italics()) {
    sentenceText = sentenceText.replace(italic, `<i>${italic}</i>`);
  }
  const linkPromises = [];
  for (const link of sentence.links()) {
    linkPromises.push(searchLink(link));
  }
  const linkSearches = await Promise.all(linkPromises);
  for (const linkSearch of linkSearches) {
    sentenceText = addLink(
      linkSearch.link,
      linkSearch.searchResults,
      sentenceText
    );
  }
  return sentenceText;
}

async function searchLink(link) {
  let searchResults = [];

  if (link.type() === "internal" && self.QuickInsert && QuickInsert.search) {
    if (
      game.settings.get(WikiImporter.ID, WikiImporter.SETTINGS.USE_QUICK_INSERT)
    ) {
      searchResults = QuickInsert.search(link.page(), null, 10).filter(
        result => result.item.name.toLowerCase() === link.page().toLowerCase()
      );
    }
  }

  return {
    searchResults,
    link
  };
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function addLink(link, searchResults, sentenceText) {
  if (link.type() === "internal") {
    const linkText = link.text() ? link.text() : link.page();
    return sentenceText.replace(
      new RegExp(escapeRegExp(linkText) + '(?![^{]*})'),
      getLink(
        link.page(),
        searchResults,
        linkText
      )
    );
  } else if (link.type() === "external") {
    return sentenceText.replace(
      link.text(),
      `<a href="${link.site()}">${link.text()}</a>`
    );
  }
}

function getLink(linkPage, searchResults, linkText) {
  if (searchResults.length > 0) {
    let result = searchResults.find(s => s.item.entityType === "Item");
    if (!result) {
      result = searchResults.find(s => s.item.entityType === "JournalEntry");
    }
    if (!result) {
      result = searchResults[0];
    }
    if (result) {
      if (result.item.package) {
        return `@Compendium[${result.item.package}.${result.item.id}]{${linkText}}`;
      } else {
        return `@JournalEntry[${result.item.id}]{${linkText}}`;
      }
    }
  }

  return `@JournalEntry[${linkPage}]{${linkText}}`;
}

function header(title, depth) {
  switch (depth) {
    case 0:
      return `<h3>${title}</h3>`;
    case 1:
      return `<h4>${title}</h4>`;
    case 2:
      return `<h5>${title}</h5>`;
    default:
      return `<h3>${title}</h3>`;
  }
}
