/* 站点前端配置。
 * turnstileSiteKey 留空 = 不启用 Cloudflare Turnstile 人机校验；
 * 想启用就填上 Site Key（Cloudflare 控制台 → Turnstile → 添加站点），
 * 同时在 Pages 项目的环境变量里设 TURNSTILE_SECRET（服务端密钥）。
 * 两个都配好才真正生效，只配一个不会拦人。
 */
window.SITE_CONFIG = {
  turnstileSiteKey: "",
};
