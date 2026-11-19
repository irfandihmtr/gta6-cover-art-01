#!/usr/bin/env python3
"""Neon Nights — original flat sample illustrations.

Draws the two invented sample pictures that ship with the app:
  skyline.jpg — sunset gradient, sun disc, skyline silhouette, palms
  neon.jpg    — night street, neon signs, wet reflections

Both are plain PIL drawings (no photos, no third-party art), rendered
at 1200x900 and saved as quality-88 JPEGs next to the photo samples.
"""

import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "app", "samples")
W, H = 1200, 900


def gradient(size, top, mid, bottom):
    img = Image.new("RGB", size)
    px = img.load()
    w, h = size
    for y in range(h):
        t = y / (h - 1)
        if t < 0.55:
            k = t / 0.55
            c = tuple(round(top[i] + (mid[i] - top[i]) * k) for i in range(3))
        else:
            k = (t - 0.55) / 0.45
            c = tuple(round(mid[i] + (bottom[i] - mid[i]) * k) for i in range(3))
        for x in range(w):
            px[x, y] = c
    return img


def palm(draw, x, y, scale, colour):
    """A simple palm: curved trunk plus radiating fronds."""
    pts = []
    for i in range(21):
        t = i / 20
        pts.append((x + scale * 0.55 * t * t * 60 / 60, y - t * scale))
    pts = [(x + (scale * 0.9) * (t ** 2), y - t * scale) for t in
           [i / 20 for i in range(21)]]
    draw.line(pts, fill=colour, width=max(3, int(scale * 0.07)))
    top_x, top_y = pts[-1]
    for ang in range(-165, -10, 18):
        rad = math.radians(ang)
        length = scale * 0.62
        end = (top_x + math.cos(rad) * length,
               top_y - abs(math.sin(rad)) * length * 0.55 + scale * 0.1)
        mid = (top_x + math.cos(rad) * length * 0.5,
               top_y - abs(math.sin(rad)) * length * 0.5)
        draw.line([mid, end], fill=colour, width=max(2, int(scale * 0.045)))


def skyline():
    img = gradient((W, H), (43, 16, 85), (217, 32, 110), (255, 140, 66))
    d = ImageDraw.Draw(img, "RGBA")

    # Sun disc low over the water line.
    cx, cy, r = W * 0.62, H * 0.58, 150
    for rr in range(r, 0, -6):
        k = rr / r
        colour = (255, int(120 + 100 * k), int(40 + 60 * k), 255)
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=colour)
    # Sun slats.
    for i, yy in enumerate(range(int(cy) + 30, int(cy) + r, 26)):
        d.rectangle([cx - r, yy, cx + r, yy + 7 + i * 2], fill=(217, 32, 110, 190))

    rng = random.Random(20261119)
    # Distant ridge.
    x = 0
    base = int(H * 0.66)
    while x < W:
        bw = rng.randint(46, 110)
        bh = rng.randint(60, 210)
        d.rectangle([x, base - bh, x + bw, base], fill=(64, 18, 84, 255))
        x += bw + rng.randint(2, 14)
    # Foreground skyline with lit windows.
    x = -10
    while x < W:
        bw = rng.randint(55, 130)
        bh = rng.randint(120, 330)
        top = base + 46 - bh
        d.rectangle([x, top, x + bw, base + 46], fill=(16, 6, 28, 255))
        for wy in range(top + 14, base + 30, 24):
            for wx in range(x + 10, x + bw - 12, 22):
                if rng.random() < 0.42:
                    d.rectangle([wx, wy, wx + 9, wy + 12],
                                fill=(255, 209, 102, 255))
        x += bw + rng.randint(4, 18)

    # Water / street band with sun reflection.
    d.rectangle([0, base + 46, W, H], fill=(24, 8, 40, 255))
    for i in range(46):
        yy = rng.randint(base + 60, H - 14)
        ln = rng.randint(30, 190)
        xx = cx - ln / 2 + rng.randint(-90, 90)
        d.line([xx, yy, xx + ln, yy], fill=(255, 120, 80, 160), width=3)

    palm(d, 92, H - 60, 300, (10, 4, 20, 255))
    palm(d, W - 130, H - 40, 360, (10, 4, 20, 255))
    img.save(os.path.join(OUT, "skyline.jpg"), quality=88)


def neon():
    img = gradient((W, H), (5, 1, 15), (27, 11, 51), (10, 3, 24))
    d = ImageDraw.Draw(img, "RGBA")
    rng = random.Random(1955)

    # Buildings left and right, converging street in the middle.
    signs = []
    for side, x0 in (("l", 0), ("r", W)):
        bx = x0
        while (side == "l" and bx < 330) or (side == "r" and bx > W - 330):
            bw = rng.randint(90, 150)
            bh = rng.randint(420, 640)
            left = bx if side == "l" else bx - bw
            d.rectangle([left, H - 240 - bh, left + bw, H - 240],
                        fill=(12, 6, 28, 255), outline=(40, 20, 70, 255))
            for wy in range(H - 240 - bh + 18, H - 260, 34):
                for wx in range(left + 12, left + bw - 16, 30):
                    if rng.random() < 0.4:
                        d.rectangle([wx, wy, wx + 13, wy + 18],
                                    fill=(120, 220, 255, 220))
            # One neon sign per building.
            sy = rng.randint(H - 240 - bh + 30, H - 420)
            colour = rng.choice([(255, 32, 150), (63, 227, 255),
                                 (255, 209, 102), (140, 90, 255)])
            sw = rng.randint(46, 74)
            sx = left + bw - 8 if side == "l" else left - sw + 8
            signs.append((sx, sy, sw, rng.randint(90, 170), colour))
            bx += bw + 6 if side == "l" else -(bw + 6)

    # Wet street.
    d.polygon([(330, H - 240), (W - 330, H - 240), (W, H), (0, H)],
              fill=(8, 4, 20, 255))
    for i in range(30):
        yy = rng.randint(H - 230, H - 8)
        t = (yy - (H - 240)) / 240
        ln = 40 + t * 260
        xx = rng.randint(60, W - 60 - int(ln))
        d.line([xx, yy, xx + ln, yy], fill=(90, 60, 160, 110), width=2)

    # Signs with glow, then their reflections on the wet street.
    for sx, sy, sw, sh, colour in signs:
        for grow, alpha in ((15, 46), (8, 80)):
            d.rounded_rectangle([sx - grow, sy - grow, sx + sw + grow,
                                 sy + sh + grow], radius=14,
                                outline=colour + (alpha,), width=5)
        d.rounded_rectangle([sx, sy, sx + sw, sy + sh], radius=10,
                            outline=colour + (255,), width=5)
        for bar in range(3):
            yy = sy + 22 + bar * (sh - 44) // 2
            d.line([sx + 10, yy, sx + sw - 10, yy],
                   fill=colour + (235,), width=5)
        ry = H - 235 + (H - 235 - sy) * 0.35
        if ry < H - 10:
            d.rounded_rectangle([sx, ry, sx + sw, min(H - 6, ry + sh * 0.5)],
                                radius=10, outline=colour + (110,), width=4)

    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img.save(os.path.join(OUT, "neon.jpg"), quality=88)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    skyline()
    neon()
    for name in ("skyline.jpg", "neon.jpg"):
        path = os.path.join(OUT, name)
        print(name, os.path.getsize(path))
