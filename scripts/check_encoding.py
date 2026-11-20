# -*- coding: utf-8 -*-
"""CI 文本编码体检：挡两类事故。

1. 文件不是合法 UTF-8（编辑器按 GBK/latin-1 存盘）→ 直接失败；
2. 字符串里出现「UTF-8 被当成 latin-1 读」的乱码（如 "ä¸äºæ"）→ 失败并指出位置。

在 deploy.yml 里、部署之前执行：python3 scripts/check_encoding.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTS = (".js", ".mjs", ".html", ".css", ".json", ".md", ".sql", ".toml", ".yml", ".yaml")
SKIP_DIRS = {".git", "node_modules", "assets"}   # assets 下是图片，不需要检查

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

CJK = re.compile(r"[\u3040-\u30ff\u4e00-\u9fff]")
# 乱码片段：UTF-8 字节被按 latin-1 解读后，会落在 U+0080–U+00FF（含 U+00B8、U+00A3 这类）。
# 正常中文正文几乎不会连续出现 3 个以上这种字符（单用的 · © ° 不受影响）。
SUSPECT = re.compile(r"[\u0080-\u00ff]{3,}")


def looks_like_mojibake(frag):
    """能按 latin-1 还原出中日文，就认定是乱码。"""
    try:
        back = frag.encode("latin-1").decode("utf-8")
    except Exception:
        return False
    return bool(CJK.search(back))


def main():
    bad = []
    checked = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith(EXTS):
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, ROOT)
            checked += 1
            try:
                text = open(path, encoding="utf-8").read()
            except UnicodeDecodeError as exc:
                bad.append(f"{rel}: 不是合法 UTF-8（{exc.reason}，字节 {exc.start}）")
                continue
            for i, line in enumerate(text.splitlines(), 1):
                for m in SUSPECT.finditer(line):
                    if looks_like_mojibake(m.group(0)):
                        bad.append(
                            f"{rel}:{i}: 疑似乱码 {m.group(0)!r} → 应为 {m.group(0).encode('latin-1').decode('utf-8')!r}"
                        )
                        break

    print(f"已检查 {checked} 个文本文件")
    if bad:
        print("\n发现问题：", file=sys.stderr)
        for b in bad:
            print("  - " + b, file=sys.stderr)
        print("\n修复提示：把乱码片段按 latin-1 编码、再按 UTF-8 解码即可还原。", file=sys.stderr)
        sys.exit(1)
    print("编码检查通过")


if __name__ == "__main__":
    main()
