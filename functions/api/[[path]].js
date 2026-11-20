/**
 * 游戏站的账号与评论 API（Cloudflare Pages Functions + D1）
 *
 *   POST /api/register  { username, password, turnstileToken? }
 *   POST /api/login     { username, password, turnstileToken? }
 *   POST /api/logout
 *   GET  /api/me
 *   GET  /api/comments?game=<gameId>
 *   POST /api/comments  { gameId, body }
 *   DELETE /api/comments/<id>        （本人或 admin）
 *
 * 密码：PBKDF2-SHA256，不存明文。会话：随机 sid 存 D1，Cookie 里只放 sid。
 *
 * 安全策略（P0）：
 *   - 登录/注册按 IP 与用户名双维度限流（D1 表 rate_limits）
 *   - 密码强度校验（长度、重复字符、常见弱口令、与用户名相同）
 *   - 可选 Cloudflare Turnstile 人机校验（配了 TURNSTILE_SECRET 才生效）
 *   - 迭代次数可通过环境变量 PBKDF2_ITER 上调，旧密码仍能验证
 */

// 迭代次数受 Workers CPU 时间约束。10000 次约 3–6ms，免费版够用。
// 付费计划（CPU 上限 30s）可在 Pages 项目里设 PBKDF2_ITER=100000 以上。
// 迭代次数存在哈希串里，所以调整后老账号照常登录。
const DEFAULT_ITER = 10000;
const SESSION_DAYS = 30;

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

// 常见弱口令（小写比较）。只挡最离谱的那批，不做完整字典。
const WEAK_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwertyui', 'qwerty123', 'abc12345', 'abcd1234', '11111111', '00000000',
  'iloveyou', 'admin123', 'administrator', 'letmein1', 'welcome1', 'welcome123',
  'passw0rd', 'p@ssw0rd', '1qaz2wsx', 'zaq12wsx', 'asdfghjk', 'qazwsxedc',
  'woaini1314', '5201314520', 'a1234567', 'aa123456', '123456aa',
]);

const RATE = {
  loginIp: { limit: 10, window: 600 },      // 同一 IP：10 次失败 / 10 分钟
  loginUser: { limit: 6, window: 600 },     // 同一用户名：6 次失败 / 10 分钟
  regIp: { limit: 5, window: 3600 },        // 同一 IP：5 次注册 / 小时
};

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });

const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const nowSec = () => Math.floor(Date.now() / 1000);

// ---------------------------------------------------------------- 密码

function iterOf(env) {
  const n = Number(env && env.PBKDF2_ITER);
  if (Number.isFinite(n) && n >= 10000 && n <= 1000000) return Math.floor(n);
  return DEFAULT_ITER;
}

async function hashPassword(password, env) {
  const iter = iterOf(env);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256,
  );
  return `${iter}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored, env) {
  const [iterStr, saltStr, hashStr] = String(stored).split('$');
  const iter = Number(iterStr) || iterOf(env);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: unb64(saltStr), iterations: iter, hash: 'SHA-256' }, key, 256,
  ));
  const want = unb64(hashStr);
  if (bits.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ want[i];
  return diff === 0;
}

/** 返回不合格原因，合格返回 null。 */
function passwordProblem(password, username) {
  const s = String(password == null ? '' : password);
  if (s.length < MIN_PASSWORD) return `密码至少 ${MIN_PASSWORD} 位`;
  if (s.length > MAX_PASSWORD) return `密码不能超过 ${MAX_PASSWORD} 位`;
  if (/^(.)\1*$/u.test(s)) return '密码不能是同一个字符重复';
  if (s.toLowerCase() === String(username || '').trim().toLowerCase()) return '密码不能和用户名相同';
  if (WEAK_PASSWORDS.has(s.toLowerCase())) return '这个密码太常见了，换一个';
  return null;
}

// ---------------------------------------------------------------- 限流

function clientIp(request) {
  // Cloudflare 一定注入 CF-Connecting-IP；取不到就返回 null，不做 IP 维度限流，
  // 避免把所有人塞进同一个桶里互相踩。
  const ip = request.headers.get('CF-Connecting-IP');
  return ip && /^[0-9a-fA-F:.]{2,45}$/.test(ip.trim()) ? ip.trim() : null;
}

/** 限流相关的一切异常都吞掉：表没建好也不该让登录挂掉。 */
async function recentCount(env, bucket, windowSec) {
  try {
    const row = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM rate_limits WHERE bucket = ? AND ts >= ?',
    ).bind(bucket, nowSec() - windowSec).first();
    return (row && row.n) || 0;
  } catch (_) {
    return 0;
  }
}

async function noteAttempt(env, bucket) {
  try {
    await env.DB.prepare('INSERT INTO rate_limits (bucket, ts) VALUES (?, ?)')
      .bind(bucket, nowSec()).run();
    // 约 1/20 的概率顺手清一次过期记录，避免表无限长大
    if (Math.random() < 0.05) {
      await env.DB.prepare('DELETE FROM rate_limits WHERE ts < ?')
        .bind(nowSec() - 86400).run();
    }
  } catch (_) {
    // 忽略
  }
}

async function limited(env, checks) {
  for (const { bucket, limit, window } of checks) {
    if (await recentCount(env, bucket, window) >= limit) return true;
  }
  return false;
}

// ---------------------------------------------------------------- Turnstile

async function turnstileOk(request, env, token) {
  const secret = env.TURNSTILE_SECRET;
  if (!secret) return true;                 // 没配就是不启用
  if (!token) return false;
  try {
    const form = new FormData();
    form.append('secret', secret);
    form.append('response', String(token));
    const ip = clientIp(request);
    if (ip) form.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    return !!data.success;
  } catch (_) {
    return false;
  }
}

// ---------------------------------------------------------------- 会话

function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function cookieHeader(sid, env, maxAge = SESSION_DAYS * 86400) {
  const domain = env.COOKIE_DOMAIN || '';
  const bits = [
    `sid=${sid}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', `Max-Age=${maxAge}`,
  ];
  if (domain) bits.push(`Domain=${domain}`);
  return bits.join('; ');
}

async function currentUser(request, env) {
  const sid = readCookie(request, 'sid');
  if (!sid) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.username, u.role, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.sid = ?`,
  ).bind(sid).first();
  if (!row) return null;
  if (row.expires_at < nowSec()) {
    await env.DB.prepare('DELETE FROM sessions WHERE sid = ?').bind(sid).run();
    return null;
  }
  return { id: row.id, username: row.username, role: row.role, sid };
}

async function createSession(env, userId) {
  const sid = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const now = nowSec();
  await env.DB.prepare(
    'INSERT INTO sessions (sid, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).bind(sid, userId, now + SESSION_DAYS * 86400, now).run();
  return sid;
}

// ---------------------------------------------------------------- 入口

export async function onRequest(context) {
  const { request, env, params } = context;
  const seg = params.path || [];
  const route = seg[0] || '';
  const method = request.method.toUpperCase();

  if (!env.DB) {
    return json({ error: 'D1 数据库未绑定（wrangler.toml 里的 d1_databases）' }, 503);
  }

  try {
    // ---- 注册 ----
    if (route === 'register' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const name = String(body.username || '').trim();
      const password = String(body.password || '');
      const ip = clientIp(request);
      const ipBucket = ip ? `reg:ip:${ip}` : null;

      if (ipBucket && await limited(env, [{ bucket: ipBucket, ...RATE.regIp }])) {
        return json({ error: '注册太频繁了，请一小时后再试' }, 429);
      }

      if (name.length < 3 || name.length > 24) return json({ error: '用户名需 3–24 个字符' }, 400);
      if (!/^[\w\u4e00-\u9fa5.-]+$/.test(name)) return json({ error: '用户名只能含字母数字下划线中文' }, 400);

      const pwProblem = passwordProblem(password, name);
      if (pwProblem) return json({ error: pwProblem }, 400);

      if (!await turnstileOk(request, env, body.turnstileToken)) {
        return json({ error: '人机校验没通过，请刷新页面重试' }, 400);
      }

      if (ipBucket) await noteAttempt(env, ipBucket);

      const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(name).first();
      if (exists) return json({ error: '用户名已被占用' }, 409);
      const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first();
      const role = (count && count.n === 0) ? 'admin' : 'user';   // 第一个注册的成为管理员
      const hash = await hashPassword(password, env);
      const now = nowSec();
      const res = await env.DB.prepare(
        'INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)',
      ).bind(name, hash, role, now).run();
      const uid = res.meta.last_row_id;
      const sid = await createSession(env, uid);
      return json({ ok: true, user: { id: uid, username: name, role } }, 200,
        { 'Set-Cookie': cookieHeader(sid, env) });
    }

    // ---- 登录 ----
    if (route === 'login' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const name = String(body.username || '').trim();
      const password = String(body.password || '');
      const ip = clientIp(request);

      const buckets = [];
      if (ip) buckets.push({ bucket: `login:ip:${ip}`, ...RATE.loginIp });
      if (name) buckets.push({ bucket: `login:user:${name.toLowerCase()}`, ...RATE.loginUser });

      if (await limited(env, buckets)) {
        return json({ error: '尝试次数过多，请 10 分钟后再试' }, 429);
      }

      const row = await env.DB.prepare(
        'SELECT id, username, password_hash, role FROM users WHERE username = ?',
      ).bind(name).first();

      if (!row) {
        for (const b of buckets) await noteAttempt(env, b.bucket);
        return json({ error: '用户名或密码不对' }, 401);
      }

      const ok = await verifyPassword(password, row.password_hash, env);
      if (!ok) {
        for (const b of buckets) await noteAttempt(env, b.bucket);
        return json({ error: '用户名或密码不对' }, 401);
      }

      if (!await turnstileOk(request, env, body.turnstileToken)) {
        return json({ error: '人机校验没通过，请刷新页面重试' }, 400);
      }

      const sid = await createSession(env, row.id);
      return json({ ok: true, user: { id: row.id, username: row.username, role: row.role } }, 200,
        { 'Set-Cookie': cookieHeader(sid, env) });
    }

    // ---- 登出 ----
    if (route === 'logout' && method === 'POST') {
      const sid = readCookie(request, 'sid');
      if (sid) await env.DB.prepare('DELETE FROM sessions WHERE sid = ?').bind(sid).run();
      return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader('', env, 0) });
    }

    // ---- 当前用户 ----
    if (route === 'me' && method === 'GET') {
      const user = await currentUser(request, env);
      return json({ user: user ? { id: user.id, username: user.username, role: user.role } : null });
    }

    // ---- 评论 ----
    if (route === 'comments') {
      const user = await currentUser(request, env);

      if (method === 'GET') {
        const game = new URL(request.url).searchParams.get('game') || '';
        if (!game) return json({ error: '缺少 game 参数' }, 400);
        const rows = await env.DB.prepare(
          `SELECT c.id, c.body, c.created_at, c.user_id, u.username
             FROM comments c JOIN users u ON u.id = c.user_id
            WHERE c.game_id = ? AND c.deleted = 0
            ORDER BY c.created_at DESC LIMIT 200`,
        ).bind(game).all();
        return json({ comments: rows.results || [] });
      }

      if (method === 'POST') {
        if (!user) return json({ error: '请先登录再评论' }, 401);
        const { gameId, body } = await request.json().catch(() => ({}));
        const text = String(body || '').trim();
        if (!gameId) return json({ error: '缺少 gameId' }, 400);
        if (text.length < 1 || text.length > 100) return json({ error: '评论需 1–100 字' }, 400);
        const now = nowSec();
        const res = await env.DB.prepare(
          'INSERT INTO comments (game_id, user_id, body, created_at) VALUES (?, ?, ?, ?)',
        ).bind(String(gameId), user.id, text, now).run();
        return json({ ok: true, id: res.meta.last_row_id });
      }
    }

    // ---- 删除评论 ----
    if (route === 'comments' && seg[1] && method === 'DELETE') {
      const user = await currentUser(request, env);
      if (!user) return json({ error: '请先登录' }, 401);
      const row = await env.DB.prepare('SELECT id, user_id FROM comments WHERE id = ?')
        .bind(Number(seg[1])).first();
      if (!row) return json({ error: '评论不存在' }, 404);
      if (row.user_id !== user.id && user.role !== 'admin') return json({ error: '无权删除' }, 403);
      await env.DB.prepare('UPDATE comments SET deleted = 1 WHERE id = ?').bind(row.id).run();
      return json({ ok: true });
    }

    return json({ error: 'not found' }, 404);
  } catch (err) {
    // 不把内部细节回给前端
    console.error('api error', err && err.stack || err);
    return json({ error: '服务器错误，请稍后再试' }, 500);
  }
}
