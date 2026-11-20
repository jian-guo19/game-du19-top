# 仓库协作约定（所有会话必读）

> 本文件由多会话协作产生。**任何会话在动手改这个仓库之前，必须先读完本文件。**

## 1. 唯一的权威工作副本

- 仓库：`https://github.com/jian-guo19/game-du19-top`，分支 `master`
- **唯一权威本地目录**：`C:\Users\杜建国\Documents\deepseek-harness\default-workspace\game-du19-top`
- 其它路径（`_site_live`、任何 `*-old`、`*-diverged`）都已废弃，只能读、不能再提交。

## 2. 每次开始工作前

```bash
cd <权威目录>
git pull --rebase origin master     # 先同步，避免分叉
git status                          # 确认工作区干净
```

## 3. 每次改动后立刻提交并推送

- **不要攒着一堆未提交的改动跨轮次、跨天。**
- 提交信息用 `类型: 说明`，例如 `feat:` / `fix:` / `style:` / `docs:`。
- 推送前再 `git pull --rebase` 一次，避免覆盖别人刚推的内容。

## 4. 绝对不要做的事

- ❌ 不要用「按目录整体覆盖」的方式同步文件（会删掉别人新增的文件）
- ❌ 不要在没有 `git pull` 的情况下直接 `git push --force`
- ❌ 不要把调试产物（截图对比图、临时 html、临时脚本）提交进仓库
- ❌ 不要创建第二个长生命周期的克隆来并行开发

## 5. 数据文件注意

- `data/games.js` 是站点全部内容。**多行文本必须写成 `\n` 转义，不能直接换行**，
  否则整个文件语法错误，站点会全白。
- 部署流水线里有 `node --check` 校验，数据语法错会直接让构建失败。

## 6. 图片注意

- Cloudflare 会缓存同名静态资源。**替换同名图片后线上可能仍是旧图**，
  解决办法：改用新文件名（如 `xxx-cover2.jpg`）并在 `games.js` 里同步引用。
