/**
 * 游戏站的账号与评论 API（Cloudflare Pages Functions + D1）
 *
 *   POST /api/register  { username, password }
 *   POST /api/login     { username, password }
 *   POST /api/logout
 *   GET  /api/me
 *   GET  /api/comments?game=<gameId>
 *   POST /api/comments  { gameId, body }
 *   DELETE /api/comments/<id>        （本人或 admin）
 *
 * 密码：PBKDF2-SHA256，不存明文。会话：随机 sid 存 D1，Cookie 里只放 sid。
 */

// 迭代次数受 Workers CPU 时间限制约束，10000 次约 3–6ms，登录时不会超时。
// 若以后上了付费计划可调到 100000，老密码仍能验证（迭代次数存在哈希串里）。
const ITER = 10000;
const SESSION_DAYS = 30;

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });

const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, key, 256,
  );
  return `${ITER}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  const [iterStr, saltStr, hashStr] = String(stored).split('$');
  const iter = Number(iterStr) || ITER;
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
  if (row.expires_at < Math.floor(Date.now() / 1000)) {
    await env.DB.prepare('DELETE FROM sessions WHERE sid = ?').bind(sid).run();
    return null;
  }
  return { id: row.id, username: row.username, role: row.role, sid };
}

async function createSession(env, userId) {
  const sid = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO sessions (sid, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).bind(sid, userId, now + SESSION_DAYS * 86400, now).run();
  return sid;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const seg = params.path || [];
  const route = seg[0] || '';
  const method = request.method.toUpperCase();

  if (!env.DB) {
    return json({ error: 'D1 数据库未绑定（wrangler.toml 里的 d1_databases）' }, 500);
  }

  try {
    // ---- 注册 ----
    if (route === 'register' && method === 'POST') {
      const { username, password } = await request.json().catch(() => ({}));
      const name = String(username || '').trim();
      if (name.length < 3 || name.length > 24) return json({ error: '用户名需 3–24 个字符' }, 400);
      if (!/^[\w\u4e00-\u9fa5.-]+$/.test(name)) return json({ error: '用户名只能含字母数字下划线中文' }, 400);
      if (!password || String(password).length < 6) return json({ error: '密码至少 6 位' }, 400);
      const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(name).first();
      if (exists) return json({ error: '用户名已被占用' }, 409);
      const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first();
      const role = (count && count.n === 0) ? 'admin' : 'user';   // 第一个注册的成为管理员
      const hash = await hashPassword(String(password));
      const now = Math.floor(Date.now() / 1000);
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
      const { username, password } = await request.json().catch(() => ({}));
      const row = await env.DB.prepare(
        'SELECT id, username, password_hash, role FROM users WHERE username = ?',
      ).bind(String(username || '').trim()).first();
      if (!row) return json({ error: '用户名或密码不对' }, 401);
      const ok = await verifyPassword(String(password || ''), row.password_hash);
      if (!ok) return json({ error: '用户名或密码不对' }, 401);
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
        if (text.length < 1 || text.length > 1000) return json({ error: '评论需 1–1000 字' }, 400);
        const now = Math.floor(Date.now() / 1000);
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
    return json({ error: '服务器错误', detail: String(err && err.message || err) }, 500);
  }
}
