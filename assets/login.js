/* 登录/注册页逻辑（从 login.html 的内联 <script> 抽出来，便于启用严格 CSP） */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};
  var siteKey = String(cfg.turnstileSiteKey || "").trim();

  var mode = "login";
  var tabLogin = document.getElementById("tabLogin");
  var tabReg = document.getElementById("tabReg");
  var form = document.getElementById("form");
  var msg = document.getElementById("msg");
  var hint = document.getElementById("hint");
  var submit = document.getElementById("submit");
  var title = document.getElementById("title");
  var pwd = document.getElementById("p");
  var tsBox = document.getElementById("tsBox");
  var tsToken = "";
  var tsWidget = null;

  var next = new URLSearchParams(location.search).get("next") || "/";
  if (next.charAt(0) !== "/" || next.charAt(1) === "/") next = "/";

  // logo 缺失时不显示裂图（原来靠内联 onerror 实现）
  var logo = document.querySelector(".brand img");
  if (logo) {
    logo.addEventListener("error", function () { logo.style.display = "none"; });
  }

  function say(text, kind) {
    msg.textContent = text || "";
    msg.className = "msg" + (kind ? " " + kind : "");
  }

  // ---------------- Turnstile（可选） ----------------
  function loadTurnstile() {
    if (!siteKey || tsWidget !== null) return;
    tsBox.classList.add("on");
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = function () {
      if (!window.turnstile) return;
      tsWidget = window.turnstile.render(tsBox, {
        sitekey: siteKey,
        theme: "light",
        callback: function (token) { tsToken = token || ""; },
        "expired-callback": function () { tsToken = ""; },
        "error-callback": function () { tsToken = ""; },
      });
    };
    s.onerror = function () {
      // 脚本加载失败就当没启用，不阻断用户登录
      tsBox.classList.remove("on");
    };
    document.head.appendChild(s);
  }

  function resetTurnstile() {
    tsToken = "";
    if (tsWidget !== null && window.turnstile) {
      try { window.turnstile.reset(tsWidget); } catch (_) {}
    }
  }

  // ---------------- 模式切换 ----------------
  function setMode(m) {
    mode = m;
    tabLogin.classList.toggle("on", m === "login");
    tabReg.classList.toggle("on", m === "register");
    submit.textContent = m === "login" ? "登录" : "注册并登录";
    title.textContent = m === "login" ? "登录后查看游戏库" : "注册一个账号";
    pwd.autocomplete = m === "login" ? "current-password" : "new-password";
    pwd.setAttribute("minlength", m === "login" ? "1" : "8");
    pwd.setAttribute("placeholder", m === "login" ? "请输入密码" : "至少 8 位");
    hint.textContent = m === "register"
      ? "注册后自动登录；密码至少 8 位，别用常见弱口令" : "";
    resetTurnstile();
    say("");
  }

  tabLogin.addEventListener("click", function () { setMode("login"); });
  tabReg.addEventListener("click", function () { setMode("register"); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var username = document.getElementById("u").value.trim();
    var password = pwd.value;
    if (!username || !password) { say("用户名和密码都要填", "err"); return; }

    if (mode === "register" && password.length < 8) {
      say("密码至少 8 位", "err");
      return;
    }
    if (siteKey && !tsToken) {
      say("请先完成下方的人机校验", "err");
      return;
    }

    submit.disabled = true;
    say(mode === "login" ? "登录中…" : "注册中…");

    var payload = { username: username, password: password };
    if (tsToken) payload.turnstileToken = tsToken;

    fetch("/api/" + mode, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) {
          say(res.d.error || "失败了，稍后再试", "err");
          submit.disabled = false;
          resetTurnstile();
          return;
        }
        say("成功，正在进入…", "ok");
        location.replace(next);
      })
      .catch(function () {
        say("网络错误，请重试", "err");
        submit.disabled = false;
        resetTurnstile();
      });
  });

  // 已登录就直接进去
  fetch("/api/me", { credentials: "same-origin" })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.user) location.replace(next); })
    .catch(function () {});

  setMode("login");
  loadTurnstile();
})();
