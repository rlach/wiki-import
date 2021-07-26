import wtf from "./lib/wtf_wikipedia-client.mjs";

const DOWNLOAD_IMAGES = false;

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
  };

  static async fetchPage(url) {
    const doc = await wtf.fetch(url);
    return docToJournal(doc);
  }

  static async convertSource(source, domain) {
    const doc = wtf(source, {
      domain: domain || "wikipedia.org",
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
    instrument: true,
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

function addParagraphsAndTables(orderedItems) {
  let result = "";
  for (const item of orderedItems) {
    if (item.elementType === "paragraph") {
      result += addParagraph(item);
    } else {
      result += addTable(item);
    }
  }
  return result;
}

async function docToJournal(doc) {
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
      result += addInfoBoxes(section.infoboxes());
      result += await addImages(section.images());
      result += "</div>";
    }
    const orderedItems = orderParagraphsAndTables(doc, section);
    result += addParagraphsAndTables(orderedItems);
    result += addLists(section.lists());
    result += "</div>";
  }

  for (const image of doc.images()) {
    if (DOWNLOAD_IMAGES) {
      await downloadImage(image);
      result = result.replace(
        image.data.file,
        getImageString(image, "wiki_import/" + image.data.file)
      );
    } else {
      result = result.replace(
        image.data.file,
        getImageString(image, image.url())
      );
    }
  }

  return result;
}

async function downloadImage(image) {
  // TODO: download images
  // if (!fs.existsSync('wiki_import/' + image.data.file)) {
  //     const response = await fetch(image.url());
  //     const blob = await response.blob()
  //     const buffer = Buffer.from(await blob.arrayBuffer());
  //     fs.writeFileSync('wiki_import/' + image.data.file, buffer);
  // }
}

async function addImages(images) {
  let result = '<div style="margin-left: auto; margin-right: 0;">';
  for (const image of images) {
    if (DOWNLOAD_IMAGES) {
      await downloadImage(image);
      result += getImageString(image, "wiki_import/" + image.data.file);
    } else {
      result += getImageString(image, image.url());
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

function addInfoBoxes(infoBoxes) {
  let result = "";
  for (const infoBox of infoBoxes) {
    let infoBoxText = '<table border="1"><tbody>';
    for (const key of Object.keys(infoBox.data)) {
      if (!ignoredInfoBoxFields.includes(key)) {
        infoBoxText += `<tr><td style="width: 30%;">${key}</td><td>${addSentence(
          infoBox.data[key]
        )}</td></tr>`;
      }
    }
    infoBoxText += "</tbody></table>";
    result += infoBoxText;
  }
  return result;
}

function addTable(table) {
  if (table.data.length > 0) {
    let tableText = '<table border="1"><thead><tr>';
    for (const key of Object.keys(table.data[0])) {
      tableText += `<td scope="col">${key}</td>`;
    }
    tableText += "</tr></thead><tbody>";
    for (const row of table.data) {
      tableText += "<tr>";
      for (const cell of Object.values(row)) {
        tableText += `<td>${addSentence(cell)}</td>`;
      }
      tableText += "</tr>";
    }
    tableText += "</tbody></table>";
    return tableText;
  } else {
    return "";
  }
}

function addLists(lists) {
  let result = "";
  for (const list of lists) {
    if (list.data.length > 0) {
      let listText = "<ul>";
      for (const sentence of list.data) {
        listText += `<li>${addSentence(sentence)}</li>`;
      }
      result += `${listText}</ul>`;
    }
  }
  return result;
}

function addText(paragraphs) {
  let result = "";
  for (const paragraph of paragraphs) {
    result += addParagraph(paragraph);
  }
  return result;
}

function addParagraph(paragraph) {
  let paragraphText = "";
  for (const sentence of paragraph.sentences()) {
    paragraphText += addSentence(sentence);
  }
  if (paragraphText.length > 0) {
    return `<p>${paragraphText}</p>`;
  } else {
    return "";
  }
}

function addSentence(sentence) {
  let sentenceText = sentence.text() + " ";
  for (const bold of sentence.bolds()) {
    sentenceText = sentenceText.replace(bold, `<b>${bold}</b>`);
  }
  for (const italic of sentence.italics()) {
    sentenceText = sentenceText.replace(italic, `<i>${italic}</i>`);
  }
  for (const link of sentence.links()) {
    if (link.type() === "internal") {
      //TODO: pf2e journal links, maybe smarter, by lookup?
      //TODO: links by id if possible?
      if (link.text()) {
        sentenceText = sentenceText.replace(
          link.text(),
          `@JournalEntry[${link.page()}]{${link.text()}}`
        );
      } else {
        sentenceText = sentenceText.replace(
          link.page(),
          `@JournalEntry[${link.page()}]`
        );
      }
    } else {
      //TODO: external links
    }
  }
  return sentenceText;
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
