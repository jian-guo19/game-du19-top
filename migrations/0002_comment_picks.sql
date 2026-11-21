-- 攻略收录：把评论区里被管理员认可的优质评论，收录进「过关体验与攻略」栏。
-- 单独建表而不是写回 data/games.js：收录是随时可增删的动态操作，
-- 放在 D1 里才能由后台直接增删，静态数据文件保持只读。
CREATE TABLE IF NOT EXISTS comment_picks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  comment_id INTEGER,
  body TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_picks_pair
  ON comment_picks (game_id, comment_id);
