/**
 * 公开版「其他软件」页渲染器 —— 服务 tools.html，和 guide.html 一样不需要登录。
 *
 * 数据来自 data/tools.js 的 window.TOOLS_DATA。
 */
(function () {
  var mount = document.getElementById("toolsMount");
  if (!mount) return;

  var data = window.TOOLS_DATA || null;
  if (!data) return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function link(u, label, cls) {
    var href = esc(u);
    if (!href) return "";
    return '<a class="' + (cls || "") + '" href="' + href + '" target="_blank" rel="noopener">' +
      esc(label) + "</a>";
  }

  function stepsHtml(steps) {
    if (!steps || !steps.length) return "";
    var li = steps.map(function (s) {
      return '<li class="tw-step">' +
        '<div class="tw-step-t">' + esc(s.t || "") + "</div>" +
        '<div class="tw-step-d">' + esc(s.d || "") + "</div>" +
        "</li>";
    }).join("");
    return '<ol class="tw-steps">' + li + "</ol>";
  }

  var items = (data.items || []).map(function (it) {
    return '<li class="tw-item">' +
      '<div class="tw-head">' +
      '<span class="tw-name">' + esc(it.name) + "</span>" +
      (it.tag ? '<span class="tw-tag">' + esc(it.tag) + "</span>" : "") +
      '<span class="tw-size">' + esc(it.size || "") + "</span>" +
      "</div>" +
      '<div class="tw-what">' + esc(it.what) + "</div>" +
      (it.why ? '<div class="tw-why">' + esc(it.why) + "</div>" : "") +
      stepsHtml(it.steps) +
      '<div class="tw-dl">' + link(it.url, "官方下载", "btn btn-sm") + "</div>" +
      "</li>";
  }).join("");

  var b = data.bundle || {};
  var bundleHtml = b.name
    ? '<section class="tw-bundle">' +
      '<h2>' + esc(b.name) + "</h2>" +
      (b.what ? '<p class="tw-lead">' + esc(b.what) + "</p>" : "") +
      '<div class="tw-fields">' +
      '<div class="tw-field"><span class="tw-k">体积</span><span class="tw-v">' + esc(b.size || "") + "</span></div>" +
      '<div class="tw-field"><span class="tw-k">解压密码</span><span class="tw-v tw-mono">' + esc(b.pwd || "") + "</span></div>" +
      '<div class="tw-field"><span class="tw-k">网盘提取码</span><span class="tw-v tw-mono">' + esc(b.passcode || "") + "</span></div>" +
      "</div>" +
      '<div class="tw-dl">' + link(b.url, "夸克网盘下载（含提取码）", "btn") + "</div>" +
      (b.sha256
        ? '<div class="tw-hash"><span class="tw-k">SHA256</span><code>' + esc(b.sha256) + "</code></div>"
        : "") +
      "</section>"
    : "";

  var notes = (data.notes || []).map(function (n) {
    return "<li>" + esc(n) + "</li>";
  }).join("");

  mount.innerHTML =
    '<div class="guide tw">' +
    '<a class="back" href="/">← 返回首页</a>' +
    '<header class="guide-head">' +
    '<p class="guide-kicker">TOOLKIT · OFFICIAL BUILDERS</p>' +
    "<h1>" + esc(data.title || "其他软件") + "</h1>" +
    '<p class="guide-lead">' + esc(data.lead || "") + "</p>" +
    "</header>" +
    '<section class="tw-list-wrap"><h2 class="tw-h2">单件下载</h2><ul class="tw-list">' + items + "</ul></section>" +
    bundleHtml +
    (notes ? '<section class="tw-notes"><h2 class="tw-h2">用之前看一眼</h2><ul class="tw-note-list">' + notes + "</ul></section>" : "") +
    '<p class="g-lead" style="margin-top:26px;">这一页不需要登录，可以直接发给别人。' +
    '游戏条目与评论需要登录后在首页使用。</p>' +
    "</div>";
})();
