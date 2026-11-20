# -*- coding: utf-8 -*-
"""生成本地预览页（冻结脚本 + 注入已登录状态），用于顶栏配色截图。"""
import io
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = os.path.dirname(os.path.abspath(__file__))

src = io.open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
html = re.sub(r'\s*<script src="[^"]*"></script>', "", src)

locked = (
    '<span class="ub-name">du-19<span class="ub-badge">管理员</span></span>'
    '<button type="button" class="ub-out" id="ubOut">退出</button>'
)
html = html.replace('<span class="user-bar" id="userBar"></span>',
                    '<span class="user-bar" id="userBar">' + locked + "</span>")
html = html.replace('<p class="hero-sub" id="heroSub"></p>',
                    '<p class="hero-sub" id="heroSub">33 款作品的介绍、截图与通关记录</p>')

io.open(os.path.join(ROOT, "_p.html"), "w", encoding="utf-8", newline="\n").write(html)

scrolled = html.replace('<header class="site-header">', '<header class="site-header is-scrolled">')
scrolled = scrolled.replace('id="headerProgress"', 'id="headerProgress" style="width:58%"')
io.open(os.path.join(ROOT, "_ps.html"), "w", encoding="utf-8", newline="\n").write(scrolled)
print("ok")
