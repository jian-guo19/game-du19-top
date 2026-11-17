-- 账号 + 评论的初始表结构（Cloudflare D1 / SQLite）
-- 执行： wrangler d1 execute game-du19-db --remote --file=./migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,          -- PBKDF2-SHA256, 格式: iter$salt_b64$hash_b64
  email         TEXT,
  role          TEXT    NOT NULL DEFAULT 'user',   -- user | admin
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  sid        TEXT    PRIMARY KEY,          -- 随机 32 字节的 hex，仅存哈希前的原值也无妨（不可猜测）
  user_id    INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id    TEXT    NOT NULL,             -- 对应 data/games.js 里的 id
  user_id    INTEGER NOT NULL,
  body       TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_game ON comments(game_id, created_at DESC);
