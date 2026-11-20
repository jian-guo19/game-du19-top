# -*- coding: utf-8 -*-
"""用像素统计验证顶栏配色：色相分布、亮度范围、与正文的对比度。"""
import sys

import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = r"C:\Users\杜建国\Documents\deepseek-harness\default-workspace\game-du19-top"


def srgb_to_lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def luminance(rgb):
    r, g, b = srgb_to_lin(np.array(rgb, dtype=float))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(fg, bg):
    l1, l2 = luminance(fg), luminance(bg)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def analyze(name, label):
    im = Image.open(f"{ROOT}\\{name}.png").convert("RGB")
    # 只取顶栏区域，避开下方 hero
    band = np.asarray(im.crop((0, 0, im.width, 60)), dtype=float)
    flat = band.reshape(-1, 3)

    # 采样若干位置看色相差异
    pts = {
        "左端": band[:, int(im.width * 0.02)],
        "中偏左": band[:, int(im.width * 0.30)],
        "中偏右": band[:, int(im.width * 0.62)],
        "右端": band[:, int(im.width * 0.97)],
    }
    print(f"\n=== {label} ({name}) ===")
    for k, col in pts.items():
        med = np.median(col, axis=0).astype(int)
        print(f"  {k:6} RGB({med[0]:3},{med[1]:3},{med[2]:3})  色差 R-B={med[0]-med[2]:+4}")

    lum = (0.2126 * flat[:, 0] + 0.7152 * flat[:, 1] + 0.0722 * flat[:, 2])
    print(f"  亮度范围: {lum.min():.0f} – {lum.max():.0f}  均值 {lum.mean():.0f}")

    # 与三种常用文字色对比
    for tname, tcol in (("正文 #2e2e35", (46, 46, 53)),
                        ("次要 #6b6b78", (107, 107, 120)),
                        ("弱化 #9a9aa6", (154, 154, 166))):
        worst = min(contrast(tcol, tuple(flat[i])) for i in range(0, len(flat), 997))
        flag = "✓" if worst >= 4.5 else ("△" if worst >= 3.0 else "✗")
        print(f"  对比度 {tname:14}: 最差 {worst:4.2f}:1  {flag}")


analyze("_c_top_crop", "顶部（未滚动）")
analyze("_c_scr_crop", "滚动后")
