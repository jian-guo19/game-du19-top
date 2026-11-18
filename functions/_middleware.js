/**
 * 全站门禁：未登录只能看到登录页。
 * 登录态 = Cookie 里的 sid，对应 D1 sessions 表。
 */

const PUBLIC = [
  /^\/api\//,
  // Cloudflare Pages 会把 /login.html 308 重定向到 /login，两种写法都要放行
  /^\/login(\.html)?\/?$/,
  /^\/assets\//,      // 样式、脚本、图片等静态资源
  /^\/favicon\.ico$/,
];

function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

// 源码与迁移脚本不允许被当成静态文件下载
const BLOCKED = [
  /^\/functions\//,
  /^\/migrations\//,
  /^\/scripts\//,
  /^\/\.github\//,
  /^\/_routes\.json$/,
  /^\/wrangler\.toml$/,
];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (BLOCKED.some((re) => re.test(path))) {
    return new Response('Not Found', { status: 404 });
  }

  if (PUBLIC.some((re) => re.test(path))) return next();

  // 数据库还没绑定时放行，避免把站长自己锁在门外（部署后应立即验证门禁是否生效）
  if (!env.DB) return next();

  const sid = readCookie(request, 'sid');
  if (sid) {
    try {
      const row = await env.DB.prepare(
        'SELECT expires_at FROM sessions WHERE sid = ?',
      ).bind(sid).first();
      if (row && row.expires_at >= Math.floor(Date.now() / 1000)) return next();
    } catch (_) {
      // 查询异常按未登录处理
    }
  }

  // 页面请求 → 跳登录页并记住原地址；其它资源 → 401
  const accept = request.headers.get('Accept') || '';
  const isDoc = request.mode === 'navigate' || accept.includes('text/html');
  if (isDoc) {
    const next_ = path + url.search;
    return Response.redirect(
      new URL('/login.html?next=' + encodeURIComponent(next_), url).toString(), 302,
    );
  }
  return new Response('Unauthorized', { status: 401 });
}
