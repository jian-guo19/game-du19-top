/**
 * 公开版新手区渲染器 —— 只服务 guide.html 这个未登录可访问的静态页。
 *
 * 为什么单独写一份：
 *   assets/app.js 是整个 SPA 的渲染器，它依赖 data/games.js 里的游戏数据，
 *   而那份数据是需要登录才能拿的。公开页不能把整包 SPA 拉起来，
 *   所以这里只做一件事：把 window.GUIDES 与 window.GUIDE_TABLE 渲染出来。
 *
 * 内容仍然是单一来源（data/guides.js），改动那边两边同时生效。
 */
(function () {
  var mount = document.getElementById("guideMount");
  if (!mount) return;

  var guides = window.GUIDES || [];
  var table = window.GUIDE_TABLE || null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // 只放行 http(s)，其余（javascript:、data: 等）一律丢掉
  function safeUrl(u) {
    var s = String(u == null ? "" : u).trim();
    if (!s) return "";
    var m = /^([a-z][a-z0-9+.-]*):/i.exec(s);
    if (!m) return "";
    var scheme = m[1].toLowerCase();
    return (scheme === "http" || scheme === "https") ? s : "";
  }

  // 步骤里可挂的下载链接：{ t: 按钮文字, url: 链接, note: 旁边的补充说明 }
  function linksHtml(links) {
    if (!links || !links.length) return "";
    var items = links.map(function (l) {
      var url = safeUrl(l.url);
      if (!url) return "";
      var note = l.note ? '<span class="g-link-note">' + esc(l.note) + "</span>" : "";
      return '<span class="g-link-item">' +
        '<a class="btn btn-sm" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(l.t || "下载") + "</a>" +
        note + "</span>";
    }).join("");
    if (!items) return "";
    return '<div class="g-links">' + items + "</div>";
  }

  var toc = guides
    .map(function (g) {
      return (
        '<button class="toc" data-target="g-' +
        esc(g.id) +
        '"><span class="toc-num">' +
        esc(g.num) +
        "</span>" +
        esc(g.title) +
        "</button>"
      );
    })
    .join("");

  var body = guides
    .map(function (g) {
      var steps = (g.steps || [])
        .map(function (s) {
          var code = s.code ? '<pre class="g-code">' + esc(s.code) + "</pre>" : "";
          return (
            "<li><div class=\"g-step-t\">" +
            esc(s.t) +
            "</div>" +
            '<div class="g-step-d">' +
            esc(s.d) +
            "</div>" +
            code +
            linksHtml(s.links) +
            "</li>"
          );
        })
        .join("");

      var note = g.note
        ? '<div class="g-note' + (g.warn ? " warn" : "") + '">' + esc(g.note) + "</div>"
        : "";

      return (
        '<article class="g-sec" id="g-' +
        esc(g.id) +
        '">' +
        '<div class="g-head"><span class="g-num">' +
        esc(g.num) +
        "</span><h2>" +
        esc(g.title) +
        "</h2></div>" +
        (g.lead ? '<p class="g-lead">' + esc(g.lead) + "</p>" : "") +
        '<ol class="g-steps">' +
        steps +
        "</ol>" +
        note +
        "</article>"
      );
    })
    .join("");

  var tableHtml = "";
  if (table && table.rows && table.rows.length) {
    var head =
      "<tr>" +
      table.cols
        .map(function (c) {
          return "<th>" + esc(c) + "</th>";
        })
        .join("") +
      "</tr>";
    var rows = table.rows
      .map(function (r) {
        return (
          "<tr>" +
          r
            .map(function (c) {
              return "<td>" + esc(c) + "</td>";
            })
            .join("") +
          "</tr>"
        );
      })
      .join("");
    tableHtml =
      '<section class="g-table-sec"><h2>' +
      esc(table.title || "故障对照表") +
      "</h2>" +
      (table.lead ? '<p class="g-lead">' + esc(table.lead) + "</p>" : "") +
      '<div class="g-table-scroll"><table><thead>' +
      head +
      "</thead><tbody>" +
      rows +
      "</tbody></table></div></section>";
  }

  mount.innerHTML =
    '<div class="guide">' +
    '<a class="back" href="/">← 返回首页</a>' +
    '<header class="guide-head">' +
    '<p class="guide-kicker">NEWBIE ZONE · OPEN</p>' +
    "<h1>新手区</h1>" +
    '<p class="guide-lead">第一次在自己电脑上装游戏？这一页按顺序看一遍，能省掉之后的很多折腾。' +
    "本站不提供下载资源，这里只讲一件事：<strong>手上已经有一个安装包，怎么把它变成能玩的状态。</strong></p>" +
    '<div class="guide-toc">' +
    toc +
    "</div>" +
    '<p class="guide-lead" style="margin-top:18px;">工具不全？<a href="/tools" class="tw-xlink">其他软件</a> ' +
    "里放了 7-Zip、Motrix 和网盘客户端的官方安装包，还有打包好的工具包。</p>" +
    "</header>" +
    body +
    tableHtml +
    '<p class="g-lead" style="margin-top:26px;">这一页不需要登录，可以直接发给别人。' +
    '游戏条目与评论需要登录后在首页使用。</p>' +
    "</div>";

  Array.prototype.forEach.call(mount.querySelectorAll(".toc"), function (btn) {
    btn.addEventListener("click", function () {
      var el = document.getElementById(btn.getAttribute("data-target"));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
