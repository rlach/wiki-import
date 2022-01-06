import { WikiImporter } from "./WikiImporter.js";

Hooks.once("init", async () => {
  if ((await FilePicker.browse("data", "wiki-import").target) === "") {
    await FilePicker.createDirectory("data", "wiki-import");
  }

  game.settings.register(WikiImporter.ID, WikiImporter.SETTINGS.INFOBOXES, {
    name: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.INFOBOXES}.name`,
    default: "",
    type: String,
    scope: "client",
    config: true,
    hint: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.INFOBOXES}.hint`
  });

  game.settings.register(
      WikiImporter.ID,
      WikiImporter.SETTINGS.DOWNLOAD_IMAGES,
      {
        name: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.DOWNLOAD_IMAGES}.name`,
        default: false,
        type: Boolean,
        scope: "client",
        config: true,
        hint: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.DOWNLOAD_IMAGES}.hint`
      }
  );

  game.settings.register(
      WikiImporter.ID,
      WikiImporter.SETTINGS.AUTO_CAPITALIZE_LINKS,
      {
        name: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.AUTO_CAPITALIZE_LINKS}.name`,
        default: false,
        type: Boolean,
        scope: "client",
        config: true,
        hint: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.AUTO_CAPITALIZE_LINKS}.hint`
      }
  );

  game.settings.register(
      WikiImporter.ID,
      WikiImporter.SETTINGS.AUTO_CAPITALIZE_LINKS,
      {
        name: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.AUTO_CAPITALIZE_LINKS}.name`,
        default: false,
        type: Boolean,
        scope: "client",
        config: true,
        hint: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.AUTO_CAPITALIZE_LINKS}.hint`
      }
  );

  if(QuickInsert) {
    game.settings.register(
        WikiImporter.ID,
        WikiImporter.SETTINGS.USE_QUICK_INSERT,
        {
          name: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.USE_QUICK_INSERT}.name`,
          default: true,
          type: Boolean,
          scope: "client",
          config: true,
          hint: `${WikiImporter.ID}.settings.${WikiImporter.SETTINGS.USE_QUICK_INSERT}.hint`
        }
    );
  }
});

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(WikiImporter.ID);
});

Hooks.on("ready", async function() {
  WikiImporter.log(true, "Wiki importer active!");
});

Hooks.on("renderJournalSheet", (app, html, data) => {
  if (game.user.isGM) {
    let title = game.i18n.localize(`${WikiImporter.ID}.buttonTitle`);
    let label = game.i18n.localize(`${WikiImporter.ID}.buttonLabel`);
    let previousDomain =
        game.user.getFlag(WikiImporter.ID, WikiImporter.FLAGS.DOMAIN) || "";
    WikiImporter.log(false, 'previous domain', previousDomain);
    let downloadFromUrlLabel = game.i18n.localize(
        `${WikiImporter.ID}.dialog.downloadFromUrl`
    );
    let wikiArticleUrlLabel = game.i18n.localize(
        `${WikiImporter.ID}.dialog.wikiArticleUrl`
    );
    let pasteTheSourceLabel = game.i18n.localize(
        `${WikiImporter.ID}.dialog.pasteSource`
    );
    let authenticationNote = game.i18n.localize(
          `${WikiImporter.ID}.dialog.authenticationNote`
    );
    let corsNote = game.i18n.localize(
          `${WikiImporter.ID}.dialog.corsNote`
    );
    let moreOnCors = game.i18n.localize(
          `${WikiImporter.ID}.dialog.moreOnCors`
    );
    let wikiSourceLabel = game.i18n.localize(
        `${WikiImporter.ID}.dialog.wikiSource`
    );
    let wikiDomainLabel = game.i18n.localize(
        `${WikiImporter.ID}.dialog.wikiDomain`
    );

    let openBtn = $(
        `<a class="open-wiki-import" title="${title}"><i class="fas fa-file-import"></i>${label}</a>`
    );
    openBtn.click(ev => {
      new Dialog({
        title: game.i18n.localize(`${WikiImporter.ID}.dialogTitle`),
        content: `
    <form>
    
    <p>${downloadFromUrlLabel}</p>
      <p class="warning-note">${authenticationNote}</p>
      <div class="form-group">
        <label>${wikiArticleUrlLabel}</label>
        <input type='text' name='articleUrl'></input>
      </div>
      <p>${pasteTheSourceLabel}</p>
      <p class="warning-note">${corsNote} <a target="_blank" href="https://github.com/rlach/wiki-import/wiki/About-CORS">${moreOnCors}</a></p>
      <div class="form-group">
         <label>${wikiSourceLabel}</label>
         <textarea id="wikiSource" name="wikiSource" rows="4" cols="50"></textarea>
      </div>
            <div class="form-group">
        <label>${wikiDomainLabel}</label>
        <input type='text' name='wikiDomain' value="${previousDomain}"></input>
      </div>
    </form>`,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize(`${WikiImporter.ID}.import`),
            callback: async html => {
              let articleUrl = html.find("input[name='articleUrl']").val();
              let wikiSource = html.find("textarea[name='wikiSource']").val();
              let domain = html.find("input[name='wikiDomain']").val();
              WikiImporter.log(false, 'found domain', domain);

              setTimeout(async () => {
                let content = "";
                if (articleUrl !== "") {
                  try {
                    content = await WikiImporter.fetchPage(articleUrl);
                  } catch (err) {
                    WikiImporter.log(false, err);
                    ui.notifications.error(
                        game.i18n.localize(`${WikiImporter.ID}.fetchError`)
                    );
                  }
                } else {
                  content = await WikiImporter.convertSource(wikiSource, domain);
                  game.user.setFlag(
                      WikiImporter.ID,
                      WikiImporter.FLAGS.DOMAIN,
                      domain
                  );
                }

                console.log('wiki-test', 'update-content');
                app.document.update({ content });
              })
            }
          }
        },
        default: "yes"
      }).render(true);
    });
    html
        .closest(".app")
        .find(".open-wiki-import")
        .remove();
    let titleElement = html.closest(".app").find(".window-title");
    openBtn.insertAfter(titleElement);
  }
});
