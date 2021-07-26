import { WikiImporter } from "./WikiImporter.js";

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(WikiImporter.ID);
});

Hooks.on("ready", async function () {
  WikiImporter.log(true, "Wiki importer active!");
});

Hooks.on("renderJournalSheet", (app, html, data) => {
  if (game.user.isGM) {
    let title = game.i18n.localize(`${WikiImporter.ID}.buttonTitle`);
    let label = game.i18n.localize(`${WikiImporter.ID}.buttonLabel`);
    let previousDomain = app.entity.getFlag(WikiImporter.ID, "domain");
    let wikiArticleUrlLabel = game.i18n.localize(
      `${WikiImporter.ID}.dialog.wikiArticleUrl`
    );
    let pasteTheSourceLabel = game.i18n.localize(
      `${WikiImporter.ID}.dialog.pasteSource`
    );
    let wikiSourceLabel = game.i18n.localize(
      `${WikiImporter.ID}.dialog.wikiSource`
    );
    let wikiDomainLabel = game.i18n.localize(
      `${WikiImporter.ID}.dialog.wikiDomain`
    );

    let openBtn = $(
      `<a class="open-gm-note" title="${title}"><i class="fas fa-file-import"></i>${label}</a>`
    );
    openBtn.click((ev) => {
      new Dialog({
        title: game.i18n.localize(`${WikiImporter.ID}.dialogTitle`),
        content: `
    <form>
    
    <p>Download article from url:</p>
      <div class="form-group">
        <label>${wikiArticleUrlLabel}</label>
        <input type='text' name='articleUrl'></input>
      </div>
      <p>${pasteTheSourceLabel}</p>
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
            callback: async (html) => {
              let articleUrl = html.find("input[name='articleUrl']").val();
              let wikiSource = html.find("textarea[name='wikiSource']").val();
              let domain = html.find("input[name='wikiDomain']").val();
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
                app.entity.setFlag(WikiImporter.ID, "domain", domain);
              }

              app.document.update({ content });
            },
          },
        },
        default: "yes",
      }).render(true);
    });
    html.closest(".app").find(".open-gm-note").remove();
    let titleElement = html.closest(".app").find(".window-title");
    openBtn.insertAfter(titleElement);
  }
});
