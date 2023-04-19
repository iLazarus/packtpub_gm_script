// ==UserScript==
// @name         Packtpub Extractor
// @namespace    http://tampermonkey
// @version      1.0.0
// @description  Extract specific div element content using jQuery from packtpub website
// @match        *://*.packtpub.com/*
// @require      http://code.jquery.com/jquery-latest.js
// @require      https://unpkg.com/turndown/dist/turndown.js
// @require      https://unpkg.com/turndown-plugin-gfm/dist/turndown-plugin-gfm.js
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @connect      *
// ==/UserScript==

(function () {
  "use strict";

  const config = { childList: true, subtree: true };
  const target = document.querySelector("body");
  const observer = new MutationObserver((mutations) => {
    let add = false;
    mutations.forEach((mutation) => {
      //   console.log(mutation.target, typeof mutation.target);
      if ($(mutation.target).find("div.distraction-free-mode").length) {
        observer.disconnect();
        const button = $(`<button style='color:red;'>Grab</button>`);
        if (!add) {
          $(".distraction-free-mode").append(button);
          add = true;
        }
        button.click(grabBook);
      }
    });
  });
  observer.observe(target, config);

  const tableConvert = (el) => {
    let h = "",
      b = "";
    var table = $(el);
    var thead = table.find("colgroup");
    if (thead.length > 0) {
      var ths = thead.find("col");
      h += "|";
      ths.each(function () {
        h += "---|";
      });
      h += "\n";
    }
    var tbody = table.find("tbody");
    if (tbody.length > 0) {
      let firstLine = true;
      var trs = tbody.find("tr");
      trs.each(function () {
        var tds = $(this).find("td");
        b += "| ";
        tds.each(function () {
          b += $(this).text().trim() + " | ";
        });
        b += "\n";
        if (firstLine) {
          h = b + h;
          b = "";
        }
        firstLine = false;
      });
    }
    return h + b + "\n";
  };

  const grabBook = () => {
    const contentDiv =
      "div#content div.content-body.w90 div.row div.epub-source";
    // const labels =
    //   "h1,h2,h3,p[class!='book-title h3'],table,pre,ul,ol,div[class='IMG---Figure']";
    // const exclude = "table p";
    // const tables = turndownPluginGfm.tables;
    // const gfm = turndownPluginGfm.gfm;
    const service = new TurndownService()
      .addRule("h1", {
        filter: ["h1"],
        replacement: (content) => "# " + content + "\n\n",
      })
      .addRule("h2", {
        filter: ["h2"],
        replacement: (content) => "## " + content + "\n\n",
      })
      .addRule("h3", {
        filter: ["h3"],
        replacement: (content) => "### " + content + "\n\n",
      })
      .keep(["table", "colgroup", "col", "tbody", "tr", "td"]);
    let data = "";
    $(contentDiv).each((i, el) => {
      const md = service.turndown(el);
      if (
        md.includes("<table") &&
        md.includes("<colgroup") &&
        md.includes("<col") &&
        md.includes("<tbody") &&
        md.includes("<tr") &&
        md.includes("<td")
      ) {
        const tmp = md.split("\n").map((it) =>
          it.includes("<table") &&
          it.includes("<colgroup") &&
          it.includes("<col") &&
          it.includes("<tbody") &&
          it.includes("<tr") &&
          it.includes("<td")
            ? tableConvert(it)
            : it
        );
        data += tmp.join('\n');
      } else {
        data += md;
      }
    });
    console.log("-------------------------------------------------");
    console.log(data);
    console.log("-------------------------------------------------");
  };
})();
