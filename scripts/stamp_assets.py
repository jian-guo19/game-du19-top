# -*- coding: utf-8 -*-
"""给 HTML 里的 JS/CSS 加上内容哈希查询串，避免浏览器用 4 小时缓存跑旧版本。

在 CI 里、deploy 之前执行：python3 scripts/stamp_assets.py
只改工作区里的 HTML（不提交），所以每次部署都会按当时内容重新打戳。

注意：这里是「根目录下所有 .html」，不是只有 index.html。
guide.html 是独立静态页，同样引 data/guides.js；漏掉它的话，
新手区会拿着 4 小时缓存里的旧教程继续教人解压。
"""
import hashlib
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATTERN = re.compile(r'(src|href)="((?:assets|data)/[^"?#]+\.(?:js|css))(?:\?v=[^"]*)?"')

def digest(rel):
    path = os.path.join(ROOT, rel)
    if not os.path.isfile(path):
        return None
    with open(path, "rb") as fh:
        return hashlib.sha1(fh.read()).hexdigest()[:10]


def pages():
    names = sorted(n for n in os.listdir(ROOT) if n.lower().endswith(".html"))
    return [os.path.join(ROOT, n) for n in names]


def stamp(path):
    html = io.open(path, encoding="utf-8").read()
    seen = {}

    def repl(m):
        attr, rel = m.group(1), m.group(2)
        if rel not in seen:
            seen[rel] = digest(rel)
        h = seen[rel]
        return m.group(0) if h is None else f'{attr}="{rel}?v={h}"'

    out, count = PATTERN.subn(repl, html)
    if out == html:
        return None
    io.open(path, "w", encoding="utf-8", newline="\n").write(out)
    return seen


def main():
    for path in pages():
        seen = stamp(path)
        name = os.path.basename(path)
        if seen is None:
            print(f"{name}：资源引用已是最新，无需改动")
            continue
        print(f"{name}：已处理 {len(seen)} 个资源引用")
        for rel, h in seen.items():
            print(f"  {rel}?v={h}")


if __name__ == "__main__":
    main()
