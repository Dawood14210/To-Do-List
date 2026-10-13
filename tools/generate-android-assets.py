#!/usr/bin/env python3
"""
Generate every raster brand asset from the single source logo, Logo.jpg.

Outputs
  * Android launcher icons (legacy, round and adaptive foreground), all densities
  * Android splash drawables for Android 11 and below (portrait, landscape,
    light and night), cream or black field with the logo centred at 40% of
    the screen width
  * Android 12+ splash icon (logo inside the 192dp safe circle of the 288dp
    system splash canvas)
  * Web: public/logo.png and public/favicon-64.png

The flat grey backdrop of Logo.jpg is flood-filled from the corners to
transparent, so the rounded logo itself is the icon shape.

Needs Pillow:  pip install pillow
Usage:         python3 tools/generate-android-assets.py
"""

import os
from collections import deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "Logo.jpg")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")
PUBLIC = os.path.join(ROOT, "public")

CREAM = (0xFF, 0xF4, 0xE0)  # colors.xml brutal_cream
BLACK = (0x00, 0x00, 0x00)
BACKDROP_GREY = 86          # flat grey around the rounded logo
BACKDROP_TOLERANCE = 14

SPLASH_LOGO_RATIO = 0.40    # logo width as a share of the screen width
ADAPTIVE_SCALE = 0.80       # logo share of the 108dp adaptive canvas (safe zone)

# Android 12+ splash: 288dp canvas, 192dp visible circle. A square of side s
# fits in that circle when s <= 192 / sqrt(2) ~= 135.7dp, so use 130dp.
SPLASH_ICON_CANVAS_DP = 288
SPLASH_ICON_LOGO_DP = 130

ICON_DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
FOREGROUND_DENSITIES = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
SPLASH_PORT = {"mdpi": (320, 480), "hdpi": (480, 800), "xhdpi": (720, 1280), "xxhdpi": (960, 1600), "xxxhdpi": (1280, 1920)}
SPLASH_LAND = {"mdpi": (480, 320), "hdpi": (800, 480), "xhdpi": (1280, 720), "xxhdpi": (1600, 960), "xxxhdpi": (1920, 1280)}


def load_logo():
    """Logo.jpg with the grey backdrop flood-filled to transparent."""
    image = Image.open(SOURCE).convert("RGBA")
    width, height = image.size
    pixels = image.load()

    def is_backdrop(colour):
        return all(abs(channel - BACKDROP_GREY) <= BACKDROP_TOLERANCE for channel in colour[:3])

    seen = set()
    queue = deque([(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)])
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < width and 0 <= y < height):
            continue
        seen.add((x, y))
        if not is_backdrop(pixels[x, y]):
            continue
        pixels[x, y] = (0, 0, 0, 0)
        queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return image


def save(image, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    image.save(path, optimize=True)
    return os.path.getsize(path)


def square_logo(logo, side):
    return logo.resize((side, side), Image.LANCZOS)


def adaptive_foreground(logo, size):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = round(size * ADAPTIVE_SCALE)
    scaled = square_logo(logo, inner)
    canvas.alpha_composite(scaled, ((size - inner) // 2, (size - inner) // 2))
    return canvas


def splash(logo, width, height, background):
    """Solid field with the logo centred at SPLASH_LOGO_RATIO of the width."""
    canvas = Image.new("RGBA", (width, height), background + (255,))
    side = round(width * SPLASH_LOGO_RATIO)
    scaled = square_logo(logo, side)
    canvas.alpha_composite(scaled, ((width - side) // 2, (height - side) // 2))
    return canvas.convert("RGB")


def main():
    logo = load_logo()
    written = []
    total = 0

    def out(path, image):
        nonlocal total
        written.append(path)
        total += save(image, path)

    # Launcher icons.
    for density, size in ICON_DENSITIES.items():
        folder = os.path.join(RES, f"mipmap-{density}")
        out(os.path.join(folder, "ic_launcher.png"), square_logo(logo, size))
        out(os.path.join(folder, "ic_launcher_round.png"), square_logo(logo, size))
    for density, size in FOREGROUND_DENSITIES.items():
        out(os.path.join(RES, f"mipmap-{density}", "ic_launcher_foreground.png"), adaptive_foreground(logo, size))

    # Splash for Android 11 and below: light, then night (black field).
    for density, (width, height) in SPLASH_PORT.items():
        out(os.path.join(RES, f"drawable-port-{density}", "splash.png"), splash(logo, width, height, CREAM))
        out(os.path.join(RES, f"drawable-port-night-{density}", "splash.png"), splash(logo, width, height, BLACK))
    for density, (width, height) in SPLASH_LAND.items():
        out(os.path.join(RES, f"drawable-land-{density}", "splash.png"), splash(logo, width, height, CREAM))
        out(os.path.join(RES, f"drawable-land-night-{density}", "splash.png"), splash(logo, width, height, BLACK))
    # Density-less defaults used when no qualifier matches.
    out(os.path.join(RES, "drawable", "splash.png"), splash(logo, 480, 320, CREAM))
    out(os.path.join(RES, "drawable-night", "splash.png"), splash(logo, 480, 320, BLACK))

    # Splash icon for Android 12+ (the platform masks it to a circle).
    icon_px = round(SPLASH_ICON_LOGO_DP * 4)  # xxxhdpi is 4px per dp
    out(os.path.join(RES, "drawable-xxxhdpi", "splash_icon_logo.png"), square_logo(logo, icon_px))

    # Web icons.
    out(os.path.join(PUBLIC, "logo.png"), square_logo(logo, 512))
    out(os.path.join(PUBLIC, "favicon-64.png"), square_logo(logo, 64))

    print(f"wrote {len(written)} PNG files ({total / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
