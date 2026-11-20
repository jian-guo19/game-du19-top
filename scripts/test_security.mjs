/**
 * 安全策略的自动化测试（不依赖 wrangler，用内存假 D1 跑真实代码）。
 *
 *   node scripts/test_security.mjs
 *
 * 覆盖：
 *   - 密码强度（太短 / 常见弱口令 / 与用户名相同）
 *   - 注册成功、登录成功、密码错误
 *   - 登录失败限流（第 7 次 429）
 *   - Turnstile 配了密钥但没带 token → 400
 *   - 数据库缺失 → API 503
 *   - 中间件 fail-closed：DB 不可用时受保护页面 503，公开页放行
 */
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const norm = (s) => s.replace(/\s+/g, ' ').trim();

function makeDb() {
  const users = [];
  const sessions = [];
  const rates = [];
  const db = {
    _users: users,
    _rates: rates,
    prepare(sql) {
      const q = norm(sql);
      const mk = (a) => ({
        async first() {
          if (q.startsWith('SELECT id FROM users WHERE username = ?')) {
            const u = users.find((x) => x.username === a[0]);
            return u ? { id: u.id } : null;
          }
          if (q.startsWith('SELECT COUNT(*) AS n FROM users')) return { n: users.length };
          if (q.startsWith('SELECT id, username, password_hash, role FROM users')) {
            return users.find((x) => x.username === a[0]) || null;
          }
          if (q.startsWith('SELECT COUNT(*) AS n FROM rate_limits')) {
            return { n: rates.filter((r) => r.bucket === a[0] && r.ts >= a[1]).length };
          }
          if (q.startsWith('SELECT expires_at FROM sessions')) {
            const s = sessions.find((x) => x.sid === a[0]);
            return s ? { expires_at: s.expires_at } : null;
          }
          return null;
        },
        async all() { return { results: [] }; },
        async run() {
          if (q.startsWith('INSERT INTO users')) {
            users.push({ id: users.length + 1, username: a[0], password_hash: a[1], role: a[2] });
            return { meta: { last_row_id: users.length } };
          }
          if (q.startsWith('INSERT INTO sessions')) {
            sessions.push({ sid: a[0], user_id: a[1], expires_at: a[2] });
            return { meta: {} };
          }
          if (q.startsWith('INSERT INTO rate_limits')) {
            rates.push({ bucket: a[0], ts: a[1] });
            return { meta: {} };
          }
          return { meta: {} };
        },
      });
      const noArgs = mk([]);
      return {
        ...noArgs,
        bind: (...a) => mk(a),
      };
    },
  };
  return db;
}

// 文件名里的方括号在 ESM 解析里不稳妥，先复制成临时 .mjs 再导入
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'du19-sec-'));
const apiPath = path.join(tmp, 'api.mjs');
fs.copyFileSync(path.join(ROOT, 'functions/api/[[path]].js'), apiPath);
const api = await import(pathToFileURL(apiPath).href);
const mw = await import(pathToFileURL(path.join(ROOT, 'functions/_middleware.js')).href);

const call = (route, method, body, env, headers = {}) =>
  api.onRequest({
    request: new Request('https://game.du-19.top/api/' + route, {
      method,
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.9', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
    params: { path: route.split('/') },
  });

let pass = 0;
const ok = (name, cond, extra = '') => {
  assert.ok(cond, `${name} 失败 ${extra}`);
  pass += 1;
  console.log(`  ✓ ${name}`);
};

// ---------------------------------------------------------------- 注册校验
{
  const env = { DB: makeDb() };
  let r = await call('register', 'POST', { username: 'alice', password: 'abc' }, env);
  ok('密码太短被拒', r.status === 400, `实际 ${r.status}`);

  r = await call('register', 'POST', { username: 'alice', password: '12345678' }, env);
  ok('常见弱口令被拒', r.status === 400);

  r = await call('register', 'POST', { username: 'alice', password: 'alice' }, env);
  ok('密码等于用户名被拒', r.status === 400);

  r = await call('register', 'POST', { username: 'alice', password: 'aaaaaaaaaaaa' }, env);
  ok('单字符重复被拒', r.status === 400);

  r = await call('register', 'POST', { username: 'alice', password: 'Str0ng-Passw0rd!' }, env);
  ok('强密码注册成功', r.status === 200, `实际 ${r.status}`);
  ok('注册返回 Set-Cookie', !!r.headers.get('Set-Cookie'));
  ok('首个用户是 admin', (await r.json()).user.role === 'admin');
}

// ---------------------------------------------------------------- 登录 + 限流
{
  const env = { DB: makeDb() };
  await call('register', 'POST', { username: 'bob', password: 'Str0ng-Passw0rd!' }, env);

  let r = await call('login', 'POST', { username: 'bob', password: 'Str0ng-Passw0rd!' }, env);
  ok('正确密码登录成功', r.status === 200);

  // 清掉上一步的成功记录不影响失败计数（成功不记），直接开始撞库
  const codes = [];
  for (let i = 0; i < 7; i++) {
    const res = await call('login', 'POST', { username: 'bob', password: 'wrong-pass-' + i }, env);
    codes.push(res.status);
  }
  ok('前 6 次错误密码是 401', codes.slice(0, 6).every((c) => c === 401), JSON.stringify(codes));
  ok('第 7 次触发限流 429', codes[6] === 429, JSON.stringify(codes));

  r = await call('login', 'POST', { username: 'bob', password: 'Str0ng-Passw0rd!' }, env);
  ok('限流期间正确密码也被挡（429）', r.status === 429);
}

// ---------------------------------------------------------------- Turnstile
{
  const env = { DB: makeDb(), TURNSTILE_SECRET: 'dummy-secret' };
  const r = await call('register', 'POST', { username: 'carol', password: 'Str0ng-Passw0rd!' }, env);
  ok('配了 Turnstile 但没带 token → 400', r.status === 400);
}

// ---------------------------------------------------------------- DB 缺失
{
  const r = await call('login', 'POST', { username: 'x', password: 'y' }, {});
  ok('DB 未绑定 → 503', r.status === 503, `实际 ${r.status}`);
}

// ---------------------------------------------------------------- 中间件
{
  const next = async () => new Response('content', { status: 200 });
  const ctx = (pathname, env) => ({
    request: new Request('https://game.du-19.top' + pathname, {
      headers: { Accept: 'text/html' },
    }),
    env,
    next,
  });

  let r = await mw.onRequest(ctx('/', {}));
  ok('fail-closed：DB 缺失时首页 503', r.status === 503, `实际 ${r.status}`);

  r = await mw.onRequest(ctx('/login.html', {}));
  ok('登录页在 DB 缺失时仍可访问', r.status === 200);

  r = await mw.onRequest(ctx('/assets/app.js', {}));
  ok('静态资源在 DB 缺失时仍可访问', r.status === 200);

  r = await mw.onRequest(ctx('/functions/_middleware.js', { DB: makeDb() }));
  ok('源码路径被 404', r.status === 404);

  r = await mw.onRequest(ctx('/migrations/0001_init.sql', { DB: makeDb() }));
  ok('迁移文件被 404', r.status === 404);

  r = await mw.onRequest(ctx('/wrangler.toml', { DB: makeDb() }));
  ok('wrangler.toml 被 404', r.status === 404);

  const db = makeDb();
  r = await mw.onRequest(ctx('/', { DB: db }));
  ok('未登录访问首页被重定向到登录页', r.status === 302 && r.headers.get('Location').includes('/login.html'));

  ok('响应带 CSP', !!r.headers.get('Content-Security-Policy'));
  ok('响应带 nosniff', r.headers.get('X-Content-Type-Options') === 'nosniff');
  ok('响应带 HSTS', !!r.headers.get('Strict-Transport-Security'));
}

// ---------------------------------------------------------------- URL 白名单
// 从 app.js 源码里取出 safeUrl 函数体，测的就是线上那段代码
{
  const src = fs.readFileSync(path.join(ROOT, 'assets/app.js'), 'utf8');
  const m = src.match(/function safeUrl\(u\) \{[\s\S]*?\n  \}/);
  assert.ok(m, 'app.js 里找不到 safeUrl');
  const safeUrl = new Function('return (' + m[0].replace(/^function safeUrl/, 'function') + ')')();

  const cases = [
    ['javascript:alert(1)', ''],
    ['JaVaScRiPt:alert(1)', ''],
    ['data:text/html,x', ''],
    ['vbscript:x', ''],
    ['//evil.com/x', ''],
    ['#/cards', '#/cards'],
    ['/guide', '/guide'],
    ['https://pan.baidu.com/s/1', 'https://pan.baidu.com/s/1'],
    ['  https://ok.com  ', 'https://ok.com'],
  ];
  let bad = 0;
  for (const [inp, exp] of cases) {
    if (safeUrl(inp) !== exp) bad += 1;
  }
  ok(`URL 白名单 ${cases.length} 个用例全部正确`, bad === 0, `${bad} 项不符`);

  // 真实数据不应被误杀
  const vm = await import('node:vm');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const f of ['data/games.js']) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox);
  }
  const games = sandbox.window.GAMES_DATA || [];
  let links = 0;
  let killed = 0;
  for (const g of games) {
    for (const l of g.links || []) {
      links += 1;
      if (!safeUrl(l.url)) killed += 1;
    }
  }
  ok(`真实数据 ${links} 条链接无一被误杀`, killed === 0, `${killed} 条被拦`);
}

console.log(`\n全部通过：${pass} 项`);
