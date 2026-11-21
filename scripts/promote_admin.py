# -*- coding: utf-8 -*-
"""在 CI 里把指定账号的 role 提升为 admin。

背景：站点的注册逻辑是「第一个注册的账号才是管理员」
（见 functions/api/[[path]].js 里 count === 0 的判断）。
站长指定的长期自用账号 dsh_selftest 是后来注册的，默认 role='user'，
只能删自己的评论。这里在每次部署时幂等地把它提升为 admin。

只用标准库，不依赖 wrangler CLI（和 ensure_d1.py 同一套思路）。
需要环境变量：CLOUDFLARE_API_TOKEN、CLOUDFLARE_ACCOUNT_ID。
可选环境变量 ADMIN_USERNAMES（逗号分隔，默认 dsh_selftest）。
"""
import os
import sys
import urllib.error
import urllib.request

DB_NAME = "game-du19-db"
DEFAULT_USERNAMES = "dsh_selftest"

ACC = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
TOK = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
BASE = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/d1/database"

names = [n.strip() for n in
         os.environ.get("ADMIN_USERNAMES", DEFAULT_USERNAMES).split(",")
         if n.strip()]


def call(url, method="GET", body=None):
    data = __import__("json").dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {TOK}",
        "Content-Type": "application/json",
        "User-Agent": "game-du19-ci/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return __import__("json").loads(r.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        print(f"[HTTP {exc.code}] {method} {url}", file=sys.stderr)
        print(detail, file=sys.stderr)
        raise


def main():
    if not ACC or not TOK:
        sys.exit("缺少 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN")
    if not names:
        sys.exit("ADMIN_USERNAMES 为空，没有要提升的账号")

    dbs = call(BASE).get("result") or []
    db = next((d for d in dbs if d.get("name") == DB_NAME), None)
    if not db:
        sys.exit(f"找不到 D1 数据库 {DB_NAME}")
    db_id = db["uuid"]

    for name in names:
        sql = "UPDATE users SET role = 'admin' WHERE username = ?"
        res = call(f"{BASE}/{db_id}/query", "POST", {"sql": sql, "params": [name]})
        if not res.get("success"):
            sys.exit(f"提升 {name} 失败：{res.get('errors')}")
        meta = (res.get("result") or [{}])[0]
        print(f"已提升 {name} → admin（影响 {meta.get('meta', {}).get('changes', '?')} 行）")

        chk = call(f"{BASE}/{db_id}/query", "POST",
                   {"sql": "SELECT id, username, role FROM users WHERE username = ?",
                    "params": [name]})
        rows = (chk.get("result") or [{}])[0].get("results") or []
        print(f"  核对：{rows}")


if __name__ == "__main__":
    main()
