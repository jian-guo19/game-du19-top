# -*- coding: utf-8 -*-
"""在 CI 里用 Cloudflare REST API 建 D1 库、建表、并把 database_id 写进 wrangler.toml。

只用标准库，不依赖 wrangler CLI，错误信息完整可见。
环境变量：CLOUDFLARE_API_TOKEN、CLOUDFLARE_ACCOUNT_ID
"""
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

NAME = "game-du19-db"
MIGRATION_DIR = "migrations"
CONFIG = "wrangler.toml"

ACC = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
TOK = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
BASE = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/d1/database"


def call(url, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {TOK}",
        "Content-Type": "application/json",
        "User-Agent": "game-du19-ci/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        print(f"[HTTP {exc.code}] {method} {url}", file=sys.stderr)
        print(detail, file=sys.stderr)
        raise


def main():
    if not ACC or not TOK:
        sys.exit("缺少 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN")

    # 1. 找库
    res = call(BASE)
    if not res.get("success", True) and res.get("errors"):
        sys.exit(f"列出 D1 数据库失败：{res['errors']}")
    dbs = res.get("result") or []
    db = next((d for d in dbs if d.get("name") == NAME), None)
    print(f"现有 D1 库：{[d.get('name') for d in dbs]}")

    # 2. 没有就建
    if not db:
        print(f"创建 D1 库 {NAME} …")
        res = call(BASE, "POST", {"name": NAME})
        if not res.get("success"):
            sys.exit(f"创建失败：{res.get('errors')}")
        db = res["result"]

    db_id = db["uuid"]
    print(f"D1 database_id = {db_id}")

    # 3. 建表（按文件名顺序执行 migrations/*.sql，逐条语句）
    files = sorted(
        os.path.join(MIGRATION_DIR, n)
        for n in os.listdir(MIGRATION_DIR)
        if n.endswith(".sql")
    )
    if not files:
        sys.exit(f"{MIGRATION_DIR}/ 下没有 .sql 迁移文件")

    stmts = []
    for path in files:
        sql = io.open(path, encoding="utf-8").read()
        body = "\n".join(l for l in sql.splitlines() if not l.strip().startswith("--"))
        for s in body.split(";"):
            s = s.strip()
            if s:
                stmts.append((os.path.basename(path), s))

    print(f"共 {len(files)} 个迁移文件、{len(stmts)} 条语句：{[os.path.basename(f) for f in files]}")
    for i, (fname, stmt) in enumerate(stmts, 1):
        res = call(f"{BASE}/{db_id}/query", "POST", {"sql": stmt})
        if not res.get("success"):
            sys.exit(f"第 {i} 条语句失败（{fname}）：{res.get('errors')}\nSQL: {stmt[:200]}")
        head = " ".join(stmt.split())[:70]
        print(f"  [{i}/{len(stmts)}] OK  {fname}  {head}")

    # 4. 把 database_id 写进 wrangler.toml
    cfg = io.open(CONFIG, encoding="utf-8").read()
    new_cfg, n = re.subn(r'database_id\s*=\s*"[^"]*"', f'database_id = "{db_id}"', cfg)
    if n == 0:
        sys.exit("wrangler.toml 里找不到 database_id 字段")
    io.open(CONFIG, "w", encoding="utf-8", newline="\n").write(new_cfg)
    print("已写入 wrangler.toml：")
    print(new_cfg)

    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as fh:
            fh.write(f"id={db_id}\n")


if __name__ == "__main__":
    main()
