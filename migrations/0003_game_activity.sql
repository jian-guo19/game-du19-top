-- 游戏浏览量：同一普通账号每天访问同一游戏计一次，管理员访问不计入。
CREATE TABLE IF NOT EXISTS game_views (
  game_id TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_view_visits (
  game_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  day INTEGER NOT NULL,
  PRIMARY KEY (game_id, user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_game_view_visits_day ON game_view_visits(day);

-- 首次上线时，已有评论不算作新提醒；以后只读 last_seen_id 之后的评论。
CREATE TABLE IF NOT EXISTS admin_comment_reads (
  user_id INTEGER PRIMARY KEY,
  last_seen_id INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO admin_comment_reads (user_id, last_seen_id)
SELECT id, COALESCE((SELECT MAX(id) FROM comments), 0)
FROM users;
