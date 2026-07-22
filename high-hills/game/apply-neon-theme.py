#!/usr/bin/env python3
"""Recolor High Hills atlases + patch sky clear color for NEON DOCK theme."""
from __future__ import annotations

import colorsys
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ATLAS = ROOT / "assets" / "atlases" / "x1"
ALL_JS = ROOT / "js" / "all.js"

# Original Phaser clear color (light cyan) -> deep neon sunset purple
OLD_CLEAR = "13958388"
NEW_CLEAR = "2824404"  # 0x2B1054


def shift_pixel(r: int, g: int, b: int, a: int, hue_deg: float, sat_mul: float = 1.12, val_mul: float = 1.0):
    if a < 16:
        return r, g, b, a
    if max(r, g, b) - min(r, g, b) < 18:
        return r, g, b, a
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h = (h + hue_deg / 360.0) % 1.0
    s = min(1.0, s * sat_mul)
    v = min(1.0, v * val_mul)
    nr, ng, nb = colorsys.hsv_to_rgb(h, s, v)
    return int(nr * 255), int(ng * 255), int(nb * 255), a


def recolor_rect(pixels, size, rect, hue_deg, sat_mul=1.12, val_mul=1.0):
    x, y, w, h = rect["x"], rect["y"], rect["w"], rect["h"]
    W, H = size
    x2, y2 = min(W, x + w), min(H, y + h)
    for py in range(y, y2):
        for px in range(x, x2):
            r, g, b, a = pixels[px, py]
            pixels[px, py] = shift_pixel(r, g, b, a, hue_deg, sat_mul, val_mul)


def recolor_car_rect(pixels, size, rect):
    """Push default orange/red cars toward electric cyan + magenta accents."""
    x, y, w, h = rect["x"], rect["y"], rect["w"], rect["h"]
    W, H = size
    x2, y2 = min(W, x + w), min(H, y + h)
    for py in range(y, y2):
        for px in range(x, x2):
            r, g, b, a = pixels[px, py]
            if a < 16:
                continue
            if max(r, g, b) - min(r, g, b) < 20:
                continue
            # Warm body paint -> cyan; yellow highlights -> magenta
            if r > g + 20 and r > 80:
                nr, ng, nb = 0, 210, 255  # electric cyan
                blend = min(1.0, (r - 80) / 120)
                r = int(r * (1 - blend) + nr * blend)
                g = int(g * (1 - blend) + ng * blend)
                b = int(b * (1 - blend) + nb * blend)
            elif r > 160 and g > 120 and b < 120:
                nr, ng, nb = 255, 64, 180  # hot pink accent
                blend = 0.65
                r = int(r * (1 - blend) + nr * blend)
                g = int(g * (1 - blend) + ng * blend)
                b = int(b * (1 - blend) + nb * blend)
            else:
                r, g, b, a = shift_pixel(r, g, b, a, 155, 1.2, 1.05)
            pixels[px, py] = (r, g, b, a)


def apply_atlas(name: str, hue_deg: float, extra_frames: dict[str, str] | None = None):
    png = ATLAS / f"{name}.png"
    meta = json.loads((ATLAS / f"{name}.json").read_text())
    backup = ATLAS / f"{name}.original.png"
    if not backup.exists():
        shutil.copy2(png, backup)

    from PIL import Image

    im = Image.open(backup if backup.exists() else png).convert("RGBA")
    px = im.load()
    size = im.size

    # Full-atlas hue shift for terrain / UI backdrops
    for py in range(size[1]):
        for px_x in range(size[0]):
            r, g, b, a = px[px_x, py]
            px[px_x, py] = shift_pixel(r, g, b, a, hue_deg, 1.15, 1.03)

    if extra_frames:
        for frame_name, mode in extra_frames.items():
            rect = meta["frames"][frame_name]["frame"]
            if mode == "car":
                recolor_car_rect(px, size, rect)
            elif mode == "bg_boost":
                recolor_rect(px, size, rect, 40, 1.25, 1.08)

    im.save(png)
    print(f"themed {png.name}")


def patch_clear_color():
    src = ALL_JS.read_text()
    if OLD_CLEAR not in src:
        print("clear color already patched or missing")
        return
    bak = ALL_JS.with_suffix(".original.js")
    if not bak.exists():
        shutil.copy2(ALL_JS, bak)
    ALL_JS.write_text(src.replace(OLD_CLEAR, NEW_CLEAR))
    print(f"patched clear color {OLD_CLEAR} -> {NEW_CLEAR}")


def main():
    garage_frames = {
        "bg10000": "bg_boost",
        "bg20000": "bg_boost",
        "bg_car0000": "car",
        **{f"car_body_up000{i}": "car" for i in range(5)},
    }
    apply_atlas("theme0", hue_deg=132, extra_frames={
        "bg10000": "bg_boost",
        "bg1Dec200000": "bg_boost",
    })
    apply_atlas("garage", hue_deg=118, extra_frames=garage_frames)
    patch_clear_color()


if __name__ == "__main__":
    main()
