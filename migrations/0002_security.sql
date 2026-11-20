-- 登录/注册的频次限制（防撞库、防批量注册）
-- 由 scripts/ensure_d1.py 在部署时自动执行，无需手动跑。
-- 表里只存「谁在什么时候试了一次」，不含任何密码或个人信息。

CREATE TABLE IF NOT EXISTS rate_limits (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket TEXT    NOT NULL,   -- 例如 ip:1.2.3.4 / login:user:alice / reg:ip:1.2.3.4
  ts     INTEGER NOT NULL    -- unix 秒
);

-- 按 bucket + 时间窗口查计数
CREATE INDEX IF NOT EXISTS idx_rate_bucket_ts ON rate_limits(bucket, ts);

-- 清理过期记录时按时间扫
CREATE INDEX IF NOT EXISTS idx_rate_ts ON rate_limits(ts);
