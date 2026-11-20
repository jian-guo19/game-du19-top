# 安全策略说明

本站的 P0 安全措施，以及需要你在 Cloudflare 控制台里做的两件可选配置。

## 已经生效的（无需配置）

| 措施 | 位置 | 说明 |
|---|---|---|
| **门禁 fail-closed** | `functions/_middleware.js` | 数据库未绑定 / 会话查询异常时返回 **503**，内容一律不外放。以前是直接放行全站。 |
| **安全响应头** | `_headers` + `_middleware.js` | CSP、HSTS、`nosniff`、`Referrer-Policy`、`Permissions-Policy`、`frame-ancestors 'none'`。Functions 的响应由中间件补，静态资源由 `_headers` 补。 |
| **URL 协议白名单** | `assets/app.js` `safeUrl()` | 只放行 `http(s)`、站内路径、`#/` 锚点；`javascript:`、`data:` 等一律丢弃。`imgPath()` 同时挡掉 `../` 和协议相对地址。 |
| **登录限流** | `functions/api/[[path]].js` | 同一 IP 10 次失败 / 10 分钟；同一用户名 6 次失败 / 10 分钟。超限返回 **429**。 |
| **注册限流** | 同上 | 同一 IP 5 次注册 / 小时。 |
| **密码强度** | 同上 | 至少 8 位、不能是单字符重复、不能等于用户名、不能是常见弱口令。 |
| **错误信息收敛** | 同上 | 500 不再把内部异常细节回给前端（只写 `console.error`）。 |
| **源码防下载** | 同上 | `functions/`、`migrations/`、`scripts/`、`wrangler.toml`、`_routes.json` 等返回 404。 |

数据表 `rate_limits` 由 `migrations/0002_security.sql` 定义，`scripts/ensure_d1.py` 在每次部署时自动按文件名顺序执行所有迁移，无需手动操作。

## 需要你决定的两个开关

### 1. 人机校验（Cloudflare Turnstile）— 可选

现在**没启用**。启用后真人几乎无感，只挡自动化脚本，**开放注册不受影响**。

1. Cloudflare 控制台 → **Turnstile** → *Add site*，域名填 `game.du-19.top`
2. 拿到 **Site Key**（公开）和 **Secret Key**（保密）
3. Site Key 填进 `data/site-config.js`：

   ```js
   window.SITE_CONFIG = { turnstileSiteKey: "0x4AAAAAAA..." };
   ```

4. Secret Key 填进 Pages 项目环境变量：**Settings → Environment variables → `TURNSTILE_SECRET`**

两个都配好才生效；只配一个不会拦人（服务端没密钥就跳过校验）。

### 2. 密码哈希迭代次数（`PBKDF2_ITER`）— 可选

默认 **10000**。Cloudflare 免费版每个请求只有 10ms CPU，调高会让登录/注册超时失败。

如果你在**付费计划**（CPU 上限 30s），可以在 Pages 环境变量里设：

```
PBKDF2_ITER = 100000
```

迭代次数存在哈希串里（`iter$salt$hash`），所以**改了之后老密码照样能登录**，新注册的才用新强度。

## 本地自检

```bash
python3 scripts/check_encoding.py    # 文本编码体检（挡首页乱码）
node scripts/test_security.mjs       # 23 项安全策略回归测试
```

这两条已经接入 `.github/workflows/deploy.yml`，任何一项失败都会拦住部署。
