#!/usr/bin/env python3
"""
Generate the BrutalTodo Android launcher icons and splash screens.

Neo-brutalist recipe: a yellow block, a thick black border and a chunky black
checkmark — no gradients, no soft shadows, square corners.

Everything is drawn analytically (signed-distance style coverage) so the shapes
stay crisp and antialiased at every density. Pure standard library: no Pillow.

Usage:  python3 tools/generate-android-assets.py
"""

import math
import os
import struct
import zlib

YELLOW = (0xFF, 0xD8, 0x4D)
BLACK = (0x00, 0x00, 0x00)
RES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "android", "app", "src", "main", "res")


# --------------------------------------------------------------------------
# PNG writing
# --------------------------------------------------------------------------

def write_png(path, width, height, rows):
    """rows: list of bytearray, each 4*width bytes (RGBA)."""
    raw = bytearray()
    for row in rows:
        raw.append(0)  # filter type 0 (None)
        raw.extend(row)

    def chunk(tag, data):
        out = struct.pack(">I", len(data)) + tag + data
        out += struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        return out

    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", header)
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as handle:
        handle.write(png)
    return os.path.getsize(path)


# --------------------------------------------------------------------------
# Shape helpers (coverage in 0..1)
# --------------------------------------------------------------------------

def coverage(distance, half):
    """Antialiased coverage for a shape whose edge is <=> distance `half`."""
    if distance <= half - 0.5:
        return 1.0
    if distance >= half + 0.5:
        return 0.0
    return half + 0.5 - distance


def rect_coverage(x, y, x0, y0, x1, y1):
    """Coverage of an axis-aligned rectangle."""
    dx = max(x0 - x, 0.0, x - x1)
    dy = max(y0 - y, 0.0, y - y1)
    if dx == 0.0 and dy == 0.0:
        return 1.0
    return coverage(math.hypot(dx, dy), 0.0)


def ring_coverage(x, y, x0, y0, x1, y1, stroke):
    """Frame: outer rectangle minus the inner one, `stroke` thick."""
    return max(
        0.0,
        rect_coverage(x, y, x0, y0, x1, y1)
        - rect_coverage(x, y, x0 + stroke, y0 + stroke, x1 - stroke, y1 - stroke),
    )


def segment_coverage(x, y, ax, ay, bx, by, half):
    """Round-capped stroke along a segment."""
    vx, vy = bx - ax, by - ay
    wx, wy = x - ax, y - ay
    length_sq = vx * vx + vy * vy
    t = 0.0 if length_sq == 0 else max(0.0, min(1.0, (wx * vx + wy * vy) / length_sq))
    px, py = ax + t * vx, ay + t * vy
    return coverage(math.hypot(x - px, y - py), half)


def check_coverage(x, y, x0, y0, x1, y1, stroke):
    """The chunky checkmark, drawn inside the given box."""
    width, height = x1 - x0, y1 - y0
    half = stroke / 2.0
    # left arm: mid-left -> bottom middle, right arm: bottom middle -> top right
    a = (x0 + 0.08 * width, y0 + 0.54 * height)
    b = (x0 + 0.38 * width, y0 + 0.86 * height)
    c = (x0 + 0.95 * width, y0 + 0.13 * height)
    return max(
        segment_coverage(x, y, a[0], a[1], b[0], b[1], half),
        segment_coverage(x, y, b[0], b[1], c[0], c[1], half),
    )


def blend(base, layer, alpha):
    return tuple(round(b + (l - b) * alpha) for b, l in zip(base, layer))


# --------------------------------------------------------------------------
# Icons
# --------------------------------------------------------------------------

def render_icon(size, round_icon=False):
    """Yellow block, thick black border, black check. AA, per-pixel."""
    inset = size * 0.045
    stroke = size * 0.075
    check_box = (size * 0.20, size * 0.26, size * 0.81, size * 0.78)
    check_stroke = size * 0.155
    centre = size / 2.0
    radius = size / 2.0 - 1.0
    ring = size * 0.07

    rows = []
    for py in range(size):
        row = bytearray()
        y = py + 0.5
        for px in range(size):
            x = px + 0.5
            if round_icon:
                dist = math.hypot(x - centre, y - centre)
                base_alpha = coverage(dist, radius)
                if base_alpha <= 0.0:
                    row.extend((0, 0, 0, 0))
                    continue
                black = coverage(dist, radius) - coverage(dist, radius - ring)
                colour = blend(YELLOW, BLACK, min(1.0, black))
                colour = blend((0, 0, 0), colour, base_alpha)
                alpha = round(255 * base_alpha)
            else:
                alpha = 255
                black = ring_coverage(x, y, inset, inset, size - inset, size - inset, stroke)
                colour = blend(YELLOW, BLACK, black)

            check = check_coverage(x, y, *check_box, stroke=check_stroke)
            colour = blend(colour, BLACK, check)
            row.extend((*colour, alpha))
        rows.append(row)
    return rows


def render_adaptive_foreground(size):
    """Transparent layer: black frame + check inside the 72dp safe zone."""
    safe = size * (72.0 / 108.0)
    offset = (size - safe) / 2.0
    stroke = safe * 0.10
    box = (offset + safe * 0.06, offset + safe * 0.06, offset + safe * 0.94, offset + safe * 0.94)
    inset = offset + safe * 0.17
    check_box = (inset, inset + safe * 0.04, size - inset, size - inset - safe * 0.04)
    check_stroke = safe * 0.17

    rows = []
    for py in range(size):
        row = bytearray()
        y = py + 0.5
        for px in range(size):
            x = px + 0.5
            black = ring_coverage(x, y, box[0], box[1], box[2], box[3], stroke)
            black = max(black, check_coverage(x, y, *check_box, stroke=check_stroke))
            alpha = round(255 * min(1.0, black))
            row.extend((0, 0, 0, alpha))
        rows.append(row)
    return rows


# --------------------------------------------------------------------------
# Splash
# --------------------------------------------------------------------------

def render_splash(width, height):
    """Yellow field, black page frame and a centred brutal block + check.

    Rectangles are written as solid byte runs (crisp edges); only the check is
    antialiased, which keeps the big images fast to generate.
    """
    unit = min(width, height)
    frame = unit * 0.030            # page frame inset
    frame_stroke = max(2.0, unit * 0.016)

    block = unit * 0.30             # centred block side
    block_x0 = (width - block) / 2.0
    block_y0 = (height - block) / 2.0
    block_x1, block_y1 = block_x0 + block, block_y0 + block
    block_stroke = block * 0.085
    shadow = unit * 0.022

    check_stroke = block * 0.20
    check_box = (
        block_x0 + block * 0.20,
        block_y0 + block * 0.20,
        block_x1 - block * 0.20,
        block_y1 - block * 0.20,
    )

    yellow_run = bytes(YELLOW + (255,)) * width
    black_run = bytes(BLACK + (255,)) * width

    def solid(row, x0, x1, colour=BLACK):
        start = max(0, int(round(x0)))
        end = min(width, int(round(x1)))
        if end > start:
            row[start * 4 : end * 4] = bytes(colour + (255,)) * (end - start)

    shadow_x0, shadow_y0 = block_x0 + shadow, block_y0 + shadow
    shadow_x1, shadow_y1 = block_x1 + shadow, block_y1 + shadow
    check_y0, check_y1 = int(check_box[1] - check_stroke), int(check_box[3] + check_stroke)
    check_x0, check_x1 = int(check_box[0] - check_stroke), int(check_box[2] + check_stroke)

    rows = []
    for py in range(height):
        y = py + 0.5
        row = bytearray(yellow_run)

        # page frame
        if y < frame + frame_stroke or y > height - frame - frame_stroke:
            row = bytearray(black_run)
        else:
            solid(row, frame, frame + frame_stroke)
            solid(row, width - frame - frame_stroke, width - frame)

        # hard shadow behind the block
        if shadow_y0 <= y <= shadow_y1:
            solid(row, shadow_x0, shadow_x1)

        # the block: yellow inside, thick black border
        if block_y0 <= y <= block_y1:
            solid(row, block_x0, block_x1, YELLOW)
            if y < block_y0 + block_stroke or y > block_y1 - block_stroke:
                solid(row, block_x0, block_x1)
            else:
                solid(row, block_x0, block_x0 + block_stroke)
                solid(row, block_x1 - block_stroke, block_x1)

        # the check (antialiased, small area)
        if check_y0 <= py <= check_y1:
            for px in range(max(0, check_x0), min(width, check_x1)):
                alpha = check_coverage(px + 0.5, y, *check_box, stroke=check_stroke)
                if alpha > 0.0:
                    index = px * 4
                    current = tuple(row[index : index + 3])
                    row[index : index + 3] = bytes(blend(current, BLACK, alpha))

        rows.append(row)
    return rows


# --------------------------------------------------------------------------

ICON_DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
FOREGROUND_DENSITIES = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
SPLASH_PORT = {"mdpi": (320, 480), "hdpi": (480, 800), "xhdpi": (720, 1280), "xxhdpi": (960, 1600), "xxxhdpi": (1280, 1920)}
SPLASH_LAND = {"mdpi": (480, 320), "hdpi": (800, 480), "xhdpi": (1280, 720), "xxhdpi": (1600, 960), "xxxhdpi": (1920, 1280)}


def main():
    files = []
    total_bytes = 0

    for density, size in ICON_DENSITIES.items():
        folder = os.path.join(RES, f"mipmap-{density}")
        files.append(os.path.join(folder, "ic_launcher.png"))
        total_bytes += write_png(files[-1], size, size, render_icon(size))
        files.append(os.path.join(folder, "ic_launcher_round.png"))
        total_bytes += write_png(files[-1], size, size, render_icon(size, round_icon=True))

    for density, size in FOREGROUND_DENSITIES.items():
        folder = os.path.join(RES, f"mipmap-{density}")
        files.append(os.path.join(folder, "ic_launcher_foreground.png"))
        total_bytes += write_png(files[-1], size, size, render_adaptive_foreground(size))

    for density, (width, height) in SPLASH_PORT.items():
        files.append(os.path.join(RES, f"drawable-port-{density}", "splash.png"))
        total_bytes += write_png(files[-1], width, height, render_splash(width, height))
    for density, (width, height) in SPLASH_LAND.items():
        files.append(os.path.join(RES, f"drawable-land-{density}", "splash.png"))
        total_bytes += write_png(files[-1], width, height, render_splash(width, height))

    # Default drawable (used by the launch theme when no density matches).
    files.append(os.path.join(RES, "drawable", "splash.png"))
    total_bytes += write_png(files[-1], 480, 320, render_splash(480, 320))

    print(f"wrote {len(files)} PNG files ({total_bytes / 1024:.0f} KB) into {RES}")


if __name__ == "__main__":
    main()
