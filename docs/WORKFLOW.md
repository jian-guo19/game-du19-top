# 工作流说明

## 部署链路

推送 `master` → GitHub Actions（`.github/workflows/deploy.yml`）→ Cloudflare Pages。

流水线关键步骤：

1. `Ensure D1 database and schema` — 通过 Cloudflare REST API 建库建表
2. `Validate data files` — `node --check data/*.js`，语法错直接失败
3. `Stamp asset versions` — 给 JS/CSS 加 `?v=<hash>` 绕过浏览器缓存
4. `Deploy to Cloudflare Pages`

## 内容来源

- 游戏安装目录：`C:\Games\绅士游戏`
- 介绍文本：以本地 readme / 官方商店页 / 发行公告为准（不引用第三方站点的成段文案）
- 官方图：VNDB（`screenshots.sexual=0` 为非露骨）、Steam
- 网盘链接：只允许站长自己的百度盘分享链接，**禁止使用其它站点的链接**
- 拿不到图时：本地启动游戏截屏（`gameshot/capture.py`）

## 常见坑

| 现象 | 原因 | 处理 |
|---|---|---|
| 站点全白 | `data/games.js` 字符串跨行 | `node --check`，把换行改成 `\n` |
| 封面是广告图 | 抓到了文章页顶部的公共横幅 | 剔除出现 ≥8 次的图 |
| 换了图线上没变 | Cloudflare CDN 缓存同名文件 | 改用新文件名 |
| 登录页死循环 | Pages 把 `/login.html` 308 到 `/login` | 中间件需同时放行两者 |
