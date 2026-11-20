(function () {
  "use strict";

  var games = window.GAMES_DATA || [];
  var meta = window.SITE_META || {};
  var IMG = "assets/images/";
  var CATS = ["全部", "电脑游戏", "手机游戏", "模拟器游戏", "其他游戏", "实用软件"];

  // 当前筛选状态
  var state = { cat: "全部", tag: "全部", q: "" };
  var filtersExpanded = false;

  var listView = document.getElementById("listView");
  var detailView = document.getElementById("detailView");
  var guideView = document.getElementById("guideView");
  var tavernView = document.getElementById("tavernView");
  var cardsView = document.getElementById("cardsView");
  var grid = document.getElementById("grid");
  var filters = document.getElementById("filters");
  var catNav = document.getElementById("catNav");
  var count = document.getElementById("count");
  var searchInput = document.getElementById("q");

  var guides = window.GUIDES || [];
  var guideTable = window.GUIDE_TABLE || null;
  var tavern = window.TAVERN_GUIDE || null;
  var cards = window.CARDS_DATA || null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function imgPath(p) {
    if (!p) return "";
    var s = String(p).trim();
    if (/^https?:\/\//i.test(s)) return s;
    // 只允许 assets/images 下的文件名，挡掉 ../ 和协议相对 //host/x
    s = s.replace(/^\.?\//, "").replace(/\.\.(\/|$)/g, "");
    if (s.charAt(0) === "/" || s.indexOf(":") !== -1) return "";
    return IMG + s;
  }

  // 只放行 http(s)、站内绝对路径、相对路径和 #/ 锚点，其余（javascript:、data: 等）一律丢弃
  function safeUrl(u) {
    var s = String(u == null ? "" : u).trim();
    if (!s) return "";
    if (s.charAt(0) === "#") return s;
    if (s.slice(0, 2) === "//") return "";   // 协议相对地址（//host/x）一律不收
    if (s.charAt(0) === "/") return s;
    var m = /^([a-z][a-z0-9+.-]*):/i.exec(s);
    if (!m) return s;                       // 无协议头 → 当作相对路径
    var scheme = m[1].toLowerCase();
    return (scheme === "http" || scheme === "https") ? s : "";
  }

  // 没有封面时用标题卡占位，配色由 id 决定，同一款游戏每次看到的颜色一致
  function hueOf(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }

  // ---------- 分类判定：一款作品可能同时属于多个分类 ----------
  function categoriesOf(g) {
    if (g.type === "software") return ["实用软件"];
    if (g.type === "other") return ["其他游戏"];
    var hay = ((g.platform || "") + " " + (g.genres || []).join(" ")).toLowerCase();
    var out = [];
    if (/模拟器|emulator|switch|yuzu|ryujinx|psp|gba|nds|nsp/.test(hay)) out.push("模拟器游戏");
    if (/android|ios|安卓|手机/.test(hay)) out.push("手机游戏");
    if (/windows|macos|linux|\bpc\b|steam|电脑/.test(hay)) out.push("电脑游戏");
    if (!out.length) out.push("电脑游戏");
    return out;
  }

  // ---------- 一条作品是否命中当前筛选 ----------
  function matches(g) {
    if (state.cat !== "全部" && categoriesOf(g).indexOf(state.cat) === -1) return false;
    if (state.tag !== "全部" && (g.genres || []).indexOf(state.tag) === -1) return false;

    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    var hay = [
      g.name, g.cnName, g.developer, g.publisher,
      g.summary, g.status, g.releaseDate, (g.genres || []).join(" ")
    ].join(" ").toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function hasFilter() {
    return state.cat !== "全部" || state.tag !== "全部" || state.q.trim() !== "";
  }

  // ---------- hero 文案 / 统计 / 公告 ----------
  function renderChrome() {
    var heroSub = document.getElementById("heroSub");
    if (heroSub) heroSub.textContent = meta.intro || "";

    var done = games.filter(function (g) { return g.status === "已通关"; }).length;
    var stats = [
      { v: games.length + " 款", l: "已收录" },
      { v: done + " 款", l: "已通关" }
    ];
    if (meta.updated) stats.push({ v: String(meta.updated).slice(5), l: "最近更新" });

    var box = document.getElementById("heroStats");
    if (box) {
      box.innerHTML = stats.map(function (s) {
        return '<div class="stat"><div class="stat-value">' + esc(s.v) +
          '</div><div class="stat-label">' + esc(s.l) + "</div></div>";
      }).join("");
    }

    var notices = meta.notices || [];
    var list = document.getElementById("noticeList");
    var more = document.getElementById("noticeMore");
    if (!list) return;

    if (!notices.length) {
      list.innerHTML = '<li class="is-empty"><span class="n-dot"></span><span>暂无公告。这一块位置先留着。</span></li>';
      if (more) more.textContent = "";
      return;
    }

    list.innerHTML = notices.map(function (n) {
      return "<li>" +
        (n.tag ? '<span class="n-tag">' + esc(n.tag) + "</span>" : "") +
        '<span class="n-text">' + esc(n.text) + "</span>" +
        (n.date ? '<span class="n-date">' + esc(String(n.date).slice(5)) + "</span>" : "") +
        "</li>";
    }).join("");
    if (more) more.textContent = notices.length + " 条";
  }

  // ---------- 一级分类导航 ----------
  function buildCatNav() {
    if (!catNav) return;
    catNav.innerHTML = CATS.map(function (c) {
      var n = c === "全部" ? games.length : games.filter(function (g) {
        return categoriesOf(g).indexOf(c) !== -1;
      }).length;
      return '<button class="cat' + (c === state.cat ? " active" : "") +
        '" data-cat="' + esc(c) + '">' + esc(c) +
        '<span class="cat-num">' + n + "</span></button>";
    }).join("");

    Array.prototype.forEach.call(catNav.querySelectorAll(".cat"), function (btn) {
      btn.addEventListener("click", function () {
        state.cat = btn.getAttribute("data-cat");
        buildCatNav();
        renderGrid();
      });
    });
  }

  // ---------- 标签筛选 ----------
  function buildFilters() {
    var set = [];
    games.forEach(function (g) {
      (g.genres || []).forEach(function (t) {
        if (set.indexOf(t) === -1) set.push(t);
      });
    });
    var all = ["全部"].concat(set);
    var LIMIT = 12;
    var shown = filtersExpanded ? all : all.slice(0, LIMIT);
    if (!filtersExpanded && state.tag !== "全部" && shown.indexOf(state.tag) === -1) {
      shown.push(state.tag);
    }

    filters.innerHTML = shown.map(function (t) {
      return '<button class="chip' + (t === state.tag ? " active" : "") +
        '" data-tag="' + esc(t) + '">' + esc(t) + "</button>";
    }).join("");

    if (all.length > LIMIT) {
      filters.innerHTML += '<button class="chip more-chip" data-more="1">' +
        (filtersExpanded ? "收起" : "更多 +" + (all.length - LIMIT)) + "</button>";
    }

    Array.prototype.forEach.call(filters.querySelectorAll(".chip[data-tag]"), function (btn) {
      btn.addEventListener("click", function () {
        state.tag = btn.getAttribute("data-tag");
        buildFilters();
        renderGrid();
      });
    });
    var more = filters.querySelector(".more-chip");
    if (more) more.addEventListener("click", function () {
      filtersExpanded = !filtersExpanded;
      buildFilters();
    });
  }

  function emptyHTML() {
    var q = state.q.trim();
    if (q) {
      return '<div class="empty">没有匹配「<strong>' + esc(q) + '</strong>」的结果。<br>换个关键词试试，或者点上面的「全部」。</div>';
    }
    if (state.cat !== "全部") {
      return '<div class="empty">「<strong>' + esc(state.cat) + '</strong>」这一类还没有收录。<br>等玩到了会加进来。</div>';
    }
    if (state.tag !== "全部") {
      return '<div class="empty">「<strong>' + esc(state.tag) + '</strong>」这个标签下暂时没有作品。</div>';
    }
    return '<div class="empty">还没有游戏数据，请在 data/games.js 中添加。</div>';
  }

  function renderGrid() {
    var list = games.filter(matches);

    count.textContent = hasFilter()
      ? list.length + " / " + games.length + " 款"
      : "共 " + games.length + " 款";

    if (!list.length) {
      grid.innerHTML = emptyHTML();
      return;
    }

    grid.innerHTML = list.map(function (g) {
      var cover = g.cover
        ? '<img src="' + esc(imgPath(g.cover)) + '" alt="' + esc(g.name) +
          ' 封面" loading="lazy" style="object-position:' + esc(g.coverPos || "center") + '" />'
        : '<div class="cover-title" style="--cover-hue:' + hueOf(g.id) +
          '"><span>' + esc(g.name) + "</span></div>";
      var tags = (g.genres || []).slice(0, 3).map(function (t) {
        return '<span class="tag">' + esc(t) + "</span>";
      }).join("");
      var status = g.status ? '<span class="tag status">' + esc(g.status) + "</span>" : "";
      return '<article class="card" data-id="' + esc(g.id) + '">' +
        '<div class="card-cover">' + cover + "</div>" +
        '<div class="card-body">' +
        '<h3 class="card-title">' + esc(g.name) + "</h3>" +
        (g.cnName ? '<p class="card-cn">' + esc(g.cnName) + "</p>" : "") +
        '<div class="card-tags">' + status + tags + "</div>" +
        '<div class="card-meta">' + esc(g.developer || "") +
        (g.releaseDate ? " · " + esc(g.releaseDate) : "") + "</div>" +
        "</div></article>";
    }).join("");

    Array.prototype.forEach.call(grid.querySelectorAll(".card"), function (card) {
      card.addEventListener("click", function () {
        location.hash = "#/game/" + card.getAttribute("data-id");
      });
    });
  }

  // ---------- 详情 ----------
  function introSection(g) {
    var text = g.intro || "";
    if (!text) return "";
    var paras = String(text).split(/\n+/).filter(function (s) { return s.trim(); });
    var body = paras.map(function (p) {
      return "<p>" + esc(p) + "</p>";
    }).join("");
    var from = g.introSource
      ? '<p class="intro-source">介绍来源：' + esc(g.introSource) + "</p>"
      : "";
    return '<section class="section"><h2>游戏介绍</h2>' +
      '<div class="intro-text">' + body + "</div>" + from + "</section>";
  }

  function renderDetail(g) {
    var facts = [
      ["开发商", g.developer], ["发行商", g.publisher],
      ["发行日期", g.releaseDate], ["平台", g.platform]
    ].filter(function (f) { return f[1]; }).map(function (f) {
      return '<div class="fact"><div class="fact-label">' + esc(f[0]) +
        '</div><div class="fact-value">' + esc(f[1]) + "</div></div>";
    }).join("");

    var tags = (g.genres || []).map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join("");
    if (g.rating) tags += '<span class="tag status">个人评分 ' + esc(g.rating) + "/5</span>";

    var tutorialBtn = g.tutorial
      ? '<a class="detail-tutorial" href="#/tavern">酒馆图文教程 →</a>'
      : "";

    var shots = (g.shots && g.shots.length)
      ? '<div class="shots">' + g.shots.map(function (p) {
          return '<div class="shot"><img src="' + esc(imgPath(p)) +
            '" alt="' + esc(g.name) + ' 截图" loading="lazy" /></div>';
        }).join("") + "</div>"
      : '<div class="placeholder">暂无截图 —— 把图片放进 assets/images/ 后在数据文件的 shots 字段登记即可显示</div>';

    var pwdNote = (g.links && g.links.length && g.password)
      ? '<p class="dl-note">解压密码：<b class="dl-pwd">' + esc(g.password) +
        '</b>　·　三层嵌套，密码只在第一层输一次　·　<a href="/guide">解压步骤看图解</a></p>'
      : "";

    var links = (g.links && g.links.length)
      ? '<div class="shots">' + g.links.map(function (l) {
          var u = safeUrl(l.url);
          if (!u) return "";                       // 非法协议直接丢掉这个链接
          // 站内锚点（#/cards 这类）就地跳转，不加新窗口
          var jump = u.charAt(0) === "#";
          return '<a class="btn" href="' + esc(u) + '"' +
            (jump ? "" : ' target="_blank" rel="noopener"') + ">" +
            esc(l.label) + "</a>";
        }).join("") + "</div>" + pwdNote
      : '<div class="links-empty">下载与购买链接待补充。</div>';

    detailView.innerHTML =
      '<div class="detail">' +
      '<a class="back" href="#/">← 返回列表</a>' +
      '<div class="detail-head">' +
      "<h1>" + esc(g.name) + "</h1>" +
      (g.cnName ? '<p class="detail-cn">' + esc(g.cnName) + "</p>" : "") +
      '<div class="detail-tags">' + tags + "</div>" + tutorialBtn + "</div>" +
      '<div class="facts">' + facts + "</div>" +
      '<section class="section"><h2>简介</h2><p>' + esc(g.summary) + "</p></section>" +
      '<section class="section"><h2>截图</h2>' + shots + "</section>" +
      introSection(g) +
      '<section class="section"><h2>过关体验与攻略</h2><p>' + esc(g.experience) + "</p></section>" +
      '<section class="section"><h2>下载与购买</h2>' + links + "</section>" +
      '<section class="section" id="commentsSec"><h2>评论</h2>' +
      '<div id="commentBox" class="comment-box">加载中…</div></section>' +
      (g.source ? '<p class="card-meta">资料来源：' + esc(g.source) + "</p>" : "") +
      "</div>";

    Array.prototype.forEach.call(detailView.querySelectorAll(".shot img"), function (im) {
      im.addEventListener("click", function () { openLightbox(im.src); });
    });

    initComments(g.id);
  }

  function openLightbox(src) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = '<img src="' + esc(src) + '" alt="截图放大" />';
    box.addEventListener("click", function () { document.body.removeChild(box); });
    document.body.appendChild(box);
  }

  // ---------- 新手区 ----------
  function renderGuide() {
    if (!guideView) return;

    var toc = guides.map(function (g) {
      return '<button class="toc" data-target="g-' + esc(g.id) + '">' +
        '<span class="toc-num">' + esc(g.num) + "</span>" + esc(g.title) + "</button>";
    }).join("");

    var body = guides.map(function (g) {
      var steps = (g.steps || []).map(function (s) {
        var code = s.code ? '<pre class="g-code">' + esc(s.code) + "</pre>" : "";
        return "<li><div class=\"g-step-t\">" + esc(s.t) + "</div>" +
          '<div class="g-step-d">' + esc(s.d) + "</div>" + code + "</li>";
      }).join("");

      var note = g.note
        ? '<div class="g-note' + (g.warn ? " warn" : "") + '">' + esc(g.note) + "</div>"
        : "";

      return '<article class="g-sec" id="g-' + esc(g.id) + '">' +
        '<div class="g-head"><span class="g-num">' + esc(g.num) + "</span>" +
        "<h2>" + esc(g.title) + "</h2></div>" +
        (g.lead ? '<p class="g-lead">' + esc(g.lead) + "</p>" : "") +
        '<ol class="g-steps">' + steps + "</ol>" +
        note +
        "</article>";
    }).join("");

    var table = "";
    if (guideTable && guideTable.rows && guideTable.rows.length) {
      var head = "<tr>" + guideTable.cols.map(function (c) {
        return "<th>" + esc(c) + "</th>";
      }).join("") + "</tr>";
      var rows = guideTable.rows.map(function (r) {
        return "<tr>" + r.map(function (c) {
          return "<td>" + esc(c) + "</td>";
        }).join("") + "</tr>";
      }).join("");
      table = '<section class="g-table-sec">' +
        "<h2>" + esc(guideTable.title || "故障对照表") + "</h2>" +
        (guideTable.lead ? '<p class="g-lead">' + esc(guideTable.lead) + "</p>" : "") +
        '<div class="g-table-scroll"><table><thead>' + head +
        "</thead><tbody>" + rows + "</tbody></table></div></section>";
    }

    guideView.innerHTML =
      '<div class="guide">' +
      '<a class="back" href="#/">← 返回列表</a>' +
      '<header class="guide-head">' +
      '<p class="guide-kicker">NEWBIE ZONE</p>' +
      "<h1>新手区</h1>" +
      '<p class="guide-lead">第一次在自己电脑上装游戏？这一页按顺序看一遍，能省掉之后的很多折腾。' +
      "本站不提供下载资源，这里只讲一件事：<strong>手上已经有一个安装包，怎么把它变成能玩的状态。</strong></p>" +
      '<div class="guide-toc">' + toc + "</div>" +
      "</header>" +
      body +
      table +
      "</div>";

    Array.prototype.forEach.call(guideView.querySelectorAll(".toc"), function (btn) {
      btn.addEventListener("click", function () {
        var el = document.getElementById(btn.getAttribute("data-target"));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  // ---------- 酒馆图文教程 ----------
  function renderTavern() {
    if (!tavernView || !tavern) return;

    var toc = tavern.sections.map(function (s) {
      return '<button class="t-toc" data-target="t-' + esc(s.id) + '">' +
        '<span class="t-toc-num">' + esc(s.num) + "</span>" + esc(s.title) + "</button>";
    }).join("");

    var body = tavern.sections.map(function (s) {
      var fig = s.fig
        ? '<figure class="t-figure"><img src="' + esc(safeUrl(s.fig)) +
          '" alt="' + esc(s.alt || s.title) + '" loading="lazy" />' +
          (s.caption ? "<figcaption>" + esc(s.caption) + "</figcaption>" : "") +
          "</figure>"
        : "";

      var steps = (s.steps || []).map(function (st) {
        return "<li><div class=\"t-step-t\">" + esc(st.t) + "</div>" +
          '<div class="t-step-d">' + esc(st.d) + "</div></li>";
      }).join("");

      var shots = (s.shots || []).map(function (c) {
        if (c && typeof c === "object" && c.src) {
          return '<figure class="t-shot-img">' +
            '<img src="' + esc(safeUrl(c.src)) + '" alt="' + esc(c.alt || c.caption || "") + '" loading="lazy" />' +
            (c.caption ? "<figcaption>" + esc(c.caption) + "</figcaption>" : "") +
            "</figure>";
        }
        return '<div class="t-shot"><span class="t-shot-mark">图</span>' +
          '<div><div class="t-shot-t">等你补图</div>' +
          '<div class="t-shot-d">' + esc(c) + "</div></div></div>";
      }).join("");

      var note = s.note
        ? '<div class="t-note' + (s.warn ? " warn" : "") + '">' + esc(s.note) + "</div>"
        : "";

      return '<article class="t-sec" id="t-' + esc(s.id) + '">' +
        '<div class="t-head"><span class="t-num">' + esc(s.num) + "</span>" +
        "<h2>" + esc(s.title) + "</h2></div>" +
        (s.lead ? '<p class="t-lead">' + esc(s.lead) + "</p>" : "") +
        fig +
        '<ol class="t-steps">' + steps + "</ol>" +
        (shots ? '<div class="t-shots">' + shots + "</div>" : "") +
        note +
        "</article>";
    }).join("");

    var end = tavern.end
      ? '<section class="t-end">' +
        "<h2>" + esc(tavern.end.title) + "</h2>" +
        "<p>" + esc(tavern.end.body) + "</p>" +
        (tavern.end.linkUrl
          ? '<a class="btn btn-primary" href="' + esc(safeUrl(tavern.end.linkUrl)) +
            '" target="_blank" rel="noopener">' + esc(tavern.end.linkLabel || "了解更多") + "</a>"
          : "") +
        "</section>"
      : "";

    tavernView.innerHTML =
      '<div class="tavern">' +
      '<a class="back" href="#/">← 返回列表</a>' +
      '<header class="tavern-head">' +
      '<p class="t-kicker">' + esc(tavern.kicker) + "</p>" +
      "<h1>" + esc(tavern.title) + "</h1>" +
      '<p class="t-intro">' + esc(tavern.lead) + "</p>" +
      '<a class="t-xlink" href="#/cards">' +
      "<b>角色卡资源</b>不想自己找卡？现成 1286 张，22 个分类，挑好直接导 →</a>" +
      '<div class="t-toc">' + toc + "</div>" +
      "</header>" +
      body + end +
      "</div>";

    Array.prototype.forEach.call(tavernView.querySelectorAll(".t-toc"), function (btn) {
      btn.addEventListener("click", function () {
        var el = document.getElementById(btn.getAttribute("data-target"));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    Array.prototype.forEach.call(tavernView.querySelectorAll(".t-figure img, .t-shot-img img"), function (im) {
      im.addEventListener("click", function () { openLightbox(im.src); });
    });
  }

  // ---------- 酒馆角色卡资源 ----------
  function renderCards() {
    if (!cardsView || !cards) return;

    var stat = cards.stats.map(function (s) {
      return '<div class="c-stat"><div class="c-stat-v">' + esc(s.v) + "</div>" +
        '<div class="c-stat-k">' + esc(s.k) + "</div></div>";
    }).join("");

    var cats = cards.cats.map(function (c) {
      return '<span class="c-cat">' + esc(c.n) + "<b>" + esc(c.c) + "</b></span>";
    }).join("");

    var whatList = cards.what.map(function (t) {
      return "<li>" + esc(t) + "</li>";
    }).join("");

    var steps = cards.steps.map(function (st) {
      return '<li><div class="t-step-t">' + esc(st.t) + "</div>" +
        '<div class="t-step-d">' + esc(st.d) + "</div></li>";
    }).join("");

    var d = cards.download;
    var files = (d.files || []).map(function (f) {
      return "<li>" + esc(f) + "</li>";
    }).join("");

    var dl = '<div class="c-dl">' +
      '<a class="btn btn-primary" href="' + esc(safeUrl(d.url)) + '" target="_blank" rel="noopener">' +
      esc(d.label) + "</a>" +
      '<p class="dl-note">解压密码：<b class="dl-pwd">' + esc(d.password) +
      '</b>　·　三层嵌套，密码只在第一层输一次　·　<a href="#/guide">解压步骤看图解</a></p>' +
      '<ul class="c-dl-files">' + files + "</ul></div>";

    var notes = cards.notes.map(function (n) {
      return '<li><div class="c-note-t">' + esc(n.t) + "</div>" +
        '<div class="c-note-d">' + esc(n.d) + "</div></li>";
    }).join("");

    function sec(num, title, body) {
      return '<article class="t-sec"><div class="t-head"><span class="t-num">' + num +
        "</span><h2>" + title + "</h2></div>" + body + "</article>";
    }

    cardsView.innerHTML = '<div class="cards">' +
      '<a class="back" href="#/">← 返回列表</a>' +
      '<header class="tavern-head">' +
      '<p class="t-kicker">' + esc(cards.kicker) + "</p>" +
      "<h1>" + esc(cards.title) + "</h1>" +
      '<p class="t-intro">' + esc(cards.lead) + "</p>" +
      '<div class="c-stats">' + stat + "</div>" +
      "</header>" +
      sec("01", "这里面有什么",
        '<ul class="c-list">' + whatList + "</ul>" +
        '<div class="c-cats">' + cats + "</div>") +
      sec("02", "怎么导入到酒馆",
        '<ol class="t-steps">' + steps + "</ol>" +
        '<div class="t-note">导入卡住的时候，问题基本不在酒馆：要么这张卡本身没写设定，' +
        "要么文件被转成了 JPG。先换一张同类卡试，能回话就说明是卡的问题，不是环境的问题。" +
        '<a class="c-more" href="#/tavern">酒馆还没装好？看图文版：解压 → 配接口 → 导卡 → 出图 → 排查 →</a></div>') +
      sec("03", "下载", dl + '<div class="t-note">' + esc(d.tip) + "</div>") +
      sec("04", "注意事项", '<ol class="c-notes">' + notes + "</ol>");
  }

  // ---------- 账号与评论 ----------
  var currentUser = null;
  var userReady = null;   // 用户信息加载完成的 Promise，评论区要等它

  function loginUrl() {
    return "/login.html?next=" + encodeURIComponent(location.pathname + location.hash);
  }

  function api(path, opts) {
    opts = opts || {};
    return fetch(path, {
      method: opts.method || "GET",
      credentials: "same-origin",
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (r.status === 401) {
        location.href = loginUrl();
        throw new Error("unauth");
      }
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.error || "请求失败");
        return d;
      });
    });
  }

  function fmtTime(sec) {
    try {
      var d = new Date(sec * 1000);
      var p = function (n) { return n < 10 ? "0" + n : "" + n; };
      return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
        " " + p(d.getHours()) + ":" + p(d.getMinutes());
    } catch (e) { return ""; }
  }

  function renderUserBar() {
    var bar = document.getElementById("userBar");
    userReady = api("/api/me").then(function (d) {
      currentUser = d.user || null;
      if (bar) {
        if (currentUser) {
          bar.innerHTML = '<span class="ub-name">' + esc(currentUser.username) +
            (currentUser.role === "admin" ? '<span class="ub-badge">管理员</span>' : "") +
            '</span><button type="button" class="ub-out" id="ubOut">退出</button>';
          var out = document.getElementById("ubOut");
          if (out) out.addEventListener("click", function () {
            api("/api/logout", { method: "POST" }).then(function () {
              location.href = "/login.html";
            }).catch(function () { location.href = "/login.html"; });
          });
        } else {
          bar.innerHTML = '<a class="ub-in" href="' + loginUrl() + '">登录 / 注册</a>';
        }
      }
      return currentUser;
    }).catch(function () { return null; });
    return userReady;
  }

  function initComments(gameId) {
    var box = document.getElementById("commentBox");
    if (!box) return;

    function refresh() {
      api("/api/comments?game=" + encodeURIComponent(gameId)).then(function (d) {
        paintComments(box, gameId, d.comments || [], refresh);
      }).catch(function (e) {
        if (String(e.message) !== "unauth") {
          box.innerHTML = '<div class="c-empty">评论加载失败：' + esc(e.message) + "</div>";
        }
      });
    }

    // 等 /api/me 回来再画，否则会误显示成「未登录」
    if (userReady) {
      box.innerHTML = '<div class="c-empty">加载中…</div>';
      userReady.then(refresh, refresh);
    } else {
      refresh();
    }
  }

  function paintComments(box, gameId, list, refresh) {
    var form = currentUser
      ? '<div class="c-form">' +
          '<textarea id="cInput" rows="3" maxlength="100" placeholder="说说你的看法…（最多 100 字）"></textarea>' +
          '<div class="c-form-foot"><span class="c-as">以 ' + esc(currentUser.username) + " 的身份发表" +
          '<span class="c-count" id="cCount">0/100</span></span>' +
          '<button type="button" class="btn btn-primary" id="cSend">发表</button></div></div>'
      : '<div class="c-form c-guest">登录后才能评论 · <a href="' + loginUrl() + '">去登录</a></div>';

    var items = list.length
      ? list.map(function (c) {
          var canDel = currentUser &&
            (currentUser.id === c.user_id || currentUser.role === "admin");
          return '<div class="c-item">' +
            '<div class="c-head"><span class="c-user">' + esc(c.username) + "</span>" +
            '<time class="c-time">' + esc(fmtTime(c.created_at)) + "</time>" +
            (canDel ? '<button type="button" class="c-del" data-id="' + Number(c.id) + '">删除</button>' : "") +
            "</div>" +
            '<div class="c-body">' + esc(c.body) + "</div></div>";
        }).join("")
      : '<div class="c-empty">还没有评论，来做第一个。</div>';

    box.innerHTML = form + '<div class="c-list">' + items + "</div>";

    var send = document.getElementById("cSend");
    var ta0 = document.getElementById("cInput");
    var count = document.getElementById("cCount");
    if (ta0 && count) {
      ta0.addEventListener("input", function () {
        var n = ta0.value.length;
        count.textContent = n + "/100";
        count.className = "c-count" + (n >= 100 ? " full" : n >= 90 ? " near" : "");
      });
    }
    if (send) {
      send.addEventListener("click", function () {
        var ta = document.getElementById("cInput");
        var text = (ta && ta.value || "").trim();
        if (!text) { ta && ta.focus(); return; }
        send.disabled = true;
        api("/api/comments", { method: "POST", body: { gameId: gameId, body: text } })
          .then(function () { refresh(); })
          .catch(function (e) {
            send.disabled = false;
            if (String(e.message) !== "unauth") alert("发表失败：" + e.message);
          });
      });
    }

    Array.prototype.forEach.call(box.querySelectorAll(".c-del"), function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("删除这条评论？")) return;
        api("/api/comments/" + btn.getAttribute("data-id"), { method: "DELETE" })
          .then(function () { refresh(); })
          .catch(function (e) { if (String(e.message) !== "unauth") alert("删除失败：" + e.message); });
      });
    });
  }

  // ---------- 顶栏状态：当前所在页高亮 + 浏览器标签标题跟着换 ----------
  var TITLE_HOME = "玩过的游戏 · game.du-19.top";
  function setChrome(navKey, title) {
    var links = document.querySelectorAll(".site-nav .nav-link");
    for (var i = 0; i < links.length; i++) {
      var on = links[i].getAttribute("data-nav") === navKey;
      links[i].classList.toggle("is-active", on);
      if (on) links[i].setAttribute("aria-current", "page");
      else links[i].removeAttribute("aria-current");
    }
    document.title = title || TITLE_HOME;
  }

  // ---------- hash 路由 ----------
  function route() {
    var m = location.hash.match(/^#\/game\/(.+)$/);
    if (m) {
      var g = games.filter(function (x) { return x.id === decodeURIComponent(m[1]); })[0];
      if (g) {
        document.body.classList.add("is-detail");
        listView.hidden = true;
        if (guideView) guideView.hidden = true;
        if (tavernView) tavernView.hidden = true;
        if (cardsView) cardsView.hidden = true;
        detailView.hidden = false;
        renderDetail(g);
        setChrome(null, g.name + " · game.du-19.top");
        window.scrollTo(0, 0);
        return;
      }
    }

    if (/^#\/guide/.test(location.hash)) {
      document.body.classList.add("is-detail");
      listView.hidden = true;
      detailView.hidden = true;
      if (tavernView) tavernView.hidden = true;
      if (cardsView) cardsView.hidden = true;
      if (guideView) {
        guideView.hidden = false;
        renderGuide();
      }
      setChrome("guide", "新手入门 · 分卷解压与报错排查 · game.du-19.top");
      window.scrollTo(0, 0);
      return;
    }

    if (/^#\/tavern/.test(location.hash)) {
      document.body.classList.add("is-detail");
      listView.hidden = true;
      detailView.hidden = true;
      if (guideView) guideView.hidden = true;
      if (cardsView) cardsView.hidden = true;
      if (tavernView) {
        tavernView.hidden = false;
        renderTavern();
      }
      setChrome("tavern", "个人酒馆 · 图文入门 · game.du-19.top");
      window.scrollTo(0, 0);
      return;
    }

    if (/^#\/cards/.test(location.hash)) {
      document.body.classList.add("is-detail");
      listView.hidden = true;
      detailView.hidden = true;
      if (guideView) guideView.hidden = true;
      if (tavernView) tavernView.hidden = true;
      if (cardsView) {
        cardsView.hidden = false;
        renderCards();
      }
      setChrome("cards", "酒馆的各个角色卡 · game.du-19.top");
      window.scrollTo(0, 0);
      return;
    }

    document.body.classList.remove("is-detail");
    detailView.hidden = true;
    if (guideView) guideView.hidden = true;
    if (tavernView) tavernView.hidden = true;
    if (cardsView) cardsView.hidden = true;
    listView.hidden = false;
    setChrome(null, TITLE_HOME);
    buildFilters();
    renderGrid();
  }

  // ---------- 搜索 ----------
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      state.q = searchInput.value;
      if (document.body.classList.contains("is-detail")) location.hash = "#/";
      renderGrid();
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        searchInput.value = "";
        state.q = "";
        renderGrid();
        searchInput.blur();
      }
    });
  }

  // "/" 或 Ctrl/⌘+K 聚焦搜索
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
      if (searchInput && !document.body.classList.contains("is-detail")) {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });

  window.addEventListener("hashchange", route);

  // ---------- 顶栏：滚动后加深毛玻璃 + 底边阅读进度 ----------
  var siteHeader = document.querySelector(".site-header");
  var headerProgress = document.getElementById("headerProgress");

  function updateHeader() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (siteHeader) siteHeader.classList.toggle("is-scrolled", y > 6);
    if (headerProgress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0;
      headerProgress.style.width = pct + "%";
    }
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", updateHeader);

  // ---------- 启动 ----------
  renderChrome();
  buildCatNav();
  renderUserBar();
  route();
  updateHeader();
})();
