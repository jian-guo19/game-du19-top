/**
 * 全站门禁：未登录只能看到登录页。
 * 登录态 = Cookie 里的 sid，对应 D1 sessions 表。
 *
 * 两条硬规则：
 *   1. fail-closed —— 数据库不可用时一律 503，绝不把内容放出去；
 *   2. 所有响应统一补安全响应头（Pages Functions 的响应不吃 _headers 文件）。
 */

const PUBLIC = [
  /^\/api\//,
  // Cloudflare Pages 会把 /login.html 308 重定向到 /login，两种写法都要放行
  /^\/login(\.html)?\/?$/,
  // 新手区公开页：不登录也能看解压教程（它只依赖 data/guides.js）
  /^\/guide(\.html)?\/?$/,
  /^\/data\/guides\.js$/,
  // 登录页要读的前端配置（含 Turnstile site key）
  /^\/data\/site-config\.js$/,
  /^\/assets\//,      // 样式、脚本、图片等静态资源
  /^\/favicon\.ico$/,
];

// 源码与迁移脚本不允许被当成静态文件下载
const BLOCKED = [
  /^\/functions\//,
  /^\/migrations\//,
  /^\/scripts\//,
  /^\/\.github\//,
  /^\/_routes\.json$/,
  /^\/wrangler\.toml$/,
  /^\/package(-lock)?\.json$/,
  /^\/README(\.md)?$/i,
];

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=15552000',
  'Content-Security-Policy': [
    "default-src 'self'",
    "img-src 'self' data:",
    // app.js 会写 style="object-position:…" 这类内联样式属性，故放开内联样式
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' https://challenges.cloudflare.com",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "font-src 'self' data:",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
};

const MAINT_HTML = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>维护中 · game.du-19.top</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:15px/1.7 system-ui,"Microsoft YaHei",sans-serif;background:#f7f7fa;color:#2e2e35;padding:24px;text-align:center}
.box{max-width:420px}h1{font-size:19px;margin:0 0 10px}p{color:#6b6b78;margin:0}</style></head>
<body><div class="box"><h1>站点暂时不可用</h1>
<p>账号服务正在维护，内容已暂停对外开放。<br>请稍后再刷新，或直接联系站长。</p></div></body></html>`;

function harden(res) {
  const nullBody = res.status === 204 || res.status === 304 || res.status === 101;
  let out;
  try {
    out = new Response(nullBody ? null : res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: new Headers(res.headers),
    });
  } catch (_) {
    return res;   // 极端情况下（body 已被读取）原样返回，不阻断请求
  }
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!out.headers.has(k)) out.headers.set(k, v);
  }
  return out;
}

function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (BLOCKED.some((re) => re.test(path))) {
    return harden(new Response('Not Found', { status: 404 }));
  }

  if (PUBLIC.some((re) => re.test(path))) {
    try {
      return harden(await next());
    } catch (_) {
      return harden(new Response('Bad Gateway', { status: 502 }));
    }
  }

  // fail-closed：数据库没绑 / 绑定失效 / 初始化失败 → 内容一律不外放
  if (!env.DB) {
    return harden(new Response(MAINT_HTML, {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '120',
      },
    }));
  }

  const sid = readCookie(request, 'sid');
  if (sid) {
    try {
      const row = await env.DB.prepare(
        'SELECT expires_at FROM sessions WHERE sid = ?',
      ).bind(sid).first();
      if (row && row.expires_at >= Math.floor(Date.now() / 1000)) {
        return harden(await next());
      }
    } catch (_) {
      // 查询异常按「无法确认登录态」处理，走下面的 fail-closed 分支
      return harden(new Response(MAINT_HTML, {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Retry-After': '120',
        },
      }));
    }
  }

  // 页面请求 → 跳登录页并记住原地址；其它资源 → 401
  const accept = request.headers.get('Accept') || '';
  const isDoc = request.mode === 'navigate' || accept.includes('text/html');
  if (isDoc) {
    const next_ = path + url.search;
    return harden(Response.redirect(
      new URL('/login.html?next=' + encodeURIComponent(next_), url).toString(), 302,
    ));
  }
  return harden(new Response('Unauthorized', { status: 401 }));
}
