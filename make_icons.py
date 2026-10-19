# -*- coding: utf-8 -*-
"""
生成 PWA 图标（iOS 主屏图标 / Android 自适应图标）
复用 ../assets/logo/make_logo.py 的绘制函数，保证与小程序图标完全一致。
运行： python make_icons.py
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'assets', 'logo'))

from PIL import Image, ImageDraw          # noqa: E402
import make_logo as M                     # noqa: E402


def flat(size):
    """满版方形（不带透明圆角），供系统自己裁切"""
    big = M.build_app_icon(M.S).resize((size, size), Image.LANCZOS)
    out = Image.new('RGB', (size, size), (255, 255, 255))
    out.paste(big, (0, 0), big)
    return out


def maskable(size):
    """Android 自适应图标：内容缩到 72% 安全区内，其余填渐变色"""
    bg = M.build_app_icon(M.S).resize((size, size), Image.LANCZOS)
    inner = int(size * 0.72)
    glyph = M.build_app_icon(M.S).resize((inner, inner), Image.LANCZOS)
    canvas = bg.copy()
    # 用背景色填满后再放缩小版，避免边缘出现裁切
    canvas.paste(bg.resize((4, 4), Image.LANCZOS).resize((size, size), Image.NEAREST), (0, 0))
    canvas.paste(glyph, ((size - inner) // 2, (size - inner) // 2), glyph)
    return canvas.convert('RGB')


def main():
    outputs = [
        ('icon-192.png', 192, flat),
        ('icon-256.png', 256, flat),
        ('icon-512.png', 512, flat),
        ('icon-maskable-512.png', 512, maskable),
        ('apple-touch-icon.png', 180, flat),
        ('favicon.png', 64, flat),
    ]
    for name, size, fn in outputs:
        p = os.path.join(HERE, name)
        fn(size).save(p, optimize=True)
        print('%-26s %4dpx  %5.1f KB' % (name, size, os.path.getsize(p) / 1024.0))


if __name__ == '__main__':
    main()
