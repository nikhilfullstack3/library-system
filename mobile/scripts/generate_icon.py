"""
Generate IB Hook app icons.
Produces: icon.png (1024x1024), splash-icon.png (512x512),
          android-icon-foreground.png (432x432, transparent bg for adaptive icon)
          android-icon-background.png (432x432, solid bg)
          android-icon-monochrome.png (432x432, white monochrome for themed icons)
          favicon.png (48x48)
"""
import math
from PIL import Image, ImageDraw

NAVY   = (15,  23,  42, 255)   # #0f172a
GREEN  = (52, 211, 153, 255)   # #34d399  emerald-400
WHITE  = (255, 255, 255, 255)
TRANS  = (0, 0, 0, 0)

# ─── helpers ────────────────────────────────────────────────────────────────

def rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.ellipse([x0, y0, x0 + 2*radius, y0 + 2*radius], fill=fill)
    draw.ellipse([x1 - 2*radius, y0, x1, y0 + 2*radius], fill=fill)
    draw.ellipse([x0, y1 - 2*radius, x0 + 2*radius, y1], fill=fill)
    draw.ellipse([x1 - 2*radius, y1 - 2*radius, x1, y1], fill=fill)

def draw_book(draw, cx, cy, size, fill):
    """Draw a stylised open-book / hook shape."""
    w = size
    h = int(size * 0.75)
    # left page
    lx0, ly0 = cx - w//2, cy - h//2
    lx1, ly1 = cx - int(w*0.04), cy + h//2
    lw = int(w * 0.06)
    draw.polygon([
        (lx0, ly0 + int(h*0.08)),
        (lx1, ly0),
        (lx1, ly1),
        (lx0, ly1 + int(h*0.08)),
    ], fill=fill)
    # right page
    rx0, ry0 = cx + int(w*0.04), cy - h//2
    rx1, ry1 = cx + w//2, cy + h//2
    draw.polygon([
        (rx0, ry0),
        (rx1, ry0 + int(h*0.08)),
        (rx1, ry1 + int(h*0.08)),
        (rx0, ry1),
    ], fill=fill)
    # spine
    draw.rectangle([cx - lw//2, ly0 - int(h*0.04), cx + lw//2, ly1 + int(h*0.04)], fill=fill)

def draw_letters_ib(draw, cx, cy, size, fill_i, fill_b):
    """Draw bold 'IB' — I as a thick rounded pill, B as classic bold B."""
    lw = max(4, size // 12)   # stroke width
    gap = size // 14
    i_w  = lw * 2             # I is just a thick vertical bar (no serifs)
    b_w  = size * 38 // 100
    total = i_w + gap + b_w
    sx = cx - total // 2

    h = size * 65 // 100      # letter height
    ty = cy - h // 2
    r  = lw                   # corner radius for rounded rects

    # ── I  ──────────────────────────────────────────────────────────────────
    ix = sx
    rounded_rect(draw, [ix, ty, ix + i_w, ty + h], r, fill_i)

    # ── B  ──────────────────────────────────────────────────────────────────
    bx = sx + i_w + gap
    sw = lw * 2               # vertical stroke width
    # vertical stroke
    rounded_rect(draw, [bx, ty, bx + sw, ty + h], r, fill_b)
    # top bulge
    tr = (h // 2) * 46 // 100
    draw.ellipse([bx + sw - 2, ty, bx + sw - 2 + tr * 2, ty + tr * 2], fill=fill_b)
    draw.rectangle([bx, ty, bx + sw + tr, ty + tr * 2], fill=fill_b)
    draw.rectangle([bx + sw, ty, bx + sw + tr, ty + tr * 2 - r], fill=fill_b)
    # bottom bulge (slightly larger)
    br = (h // 2) * 52 // 100
    # fill middle gap between top and bottom bulges
    draw.rectangle([bx + sw, ty + tr * 2 - lw, bx + sw + min(tr, br) + lw, ty + h - br * 2 + lw], fill=fill_b)
    draw.ellipse([bx + sw - 2, ty + h - br * 2, bx + sw - 2 + br * 2, ty + h], fill=fill_b)
    draw.rectangle([bx, ty + h - br * 2, bx + sw + br, ty + h], fill=fill_b)
    draw.rectangle([bx + sw, ty + h - br * 2 + r, bx + sw + br, ty + h], fill=fill_b)


def make_base(size, bg=NAVY, radius_frac=0.22):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = int(size * radius_frac)
    rounded_rect(draw, [0, 0, size, size], r, bg)
    return img, draw


# ─── icon.png  1024×1024 ────────────────────────────────────────────────────
def draw_hook_underline(draw, cx, cy_start, size, fill):
    """Draw a small green hook/arc underline below the letters."""
    lw = max(3, size // 55)
    hook_w = int(size * 0.28)
    hook_h = int(size * 0.08)
    hx = cx - hook_w // 2
    hy = cy_start
    draw.arc([hx, hy, hx + hook_w, hy + hook_h * 2],
             start=180, end=360, fill=fill, width=lw)
    # short upward tick on right end
    tx = hx + hook_w
    ty = hy + hook_h
    draw.line([(tx, ty), (tx + lw * 3, ty - lw * 5)], fill=fill, width=lw)


def make_icon(size=1024):
    img, draw = make_base(size)
    cx, cy = size // 2, size // 2

    # draw IB — white I, green B
    draw_letters_ib(draw, cx, cy - size // 18, int(size * 0.54), WHITE, GREEN)

    # hook underline
    draw_hook_underline(draw, cx, cy + int(size * 0.20), size, GREEN)

    return img


# ─── android foreground (transparent bg, safe zone = inner 66%) ─────────────
def make_android_fg(size=432):
    img = Image.new("RGBA", (size, size), TRANS)
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2
    draw_letters_ib(draw, cx, cy - size // 18, int(size * 0.50), WHITE, GREEN)
    draw_hook_underline(draw, cx, cy + int(size * 0.18), size, GREEN)
    return img


def make_android_bg(size=432):
    return Image.new("RGBA", (size, size), NAVY)


def make_android_mono(size=432):
    img = Image.new("RGBA", (size, size), TRANS)
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2
    draw_letters_ib(draw, cx, cy - size // 18, int(size * 0.50), WHITE, WHITE)
    draw_hook_underline(draw, cx, cy + int(size * 0.18), size, WHITE)
    return img


def make_splash(size=512):
    img = Image.new("RGBA", (size, size), NAVY)
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2
    draw_letters_ib(draw, cx, cy - size // 18, int(size * 0.46), WHITE, GREEN)
    draw_hook_underline(draw, cx, cy + int(size * 0.19), size, GREEN)
    return img


def make_favicon(size=48):
    img, draw = make_base(size, radius_frac=0.18)
    cx, cy = size // 2, size // 2
    draw_letters_ib(draw, cx, cy - size // 18, int(size * 0.60), WHITE, GREEN)
    return img


# ─── run ────────────────────────────────────────────────────────────────────
base = "/Users/nikse/Desktop/library-system/mobile/assets/images"

make_icon(1024).save(f"{base}/icon.png")
make_splash(512).save(f"{base}/splash-icon.png")
make_android_fg(432).save(f"{base}/android-icon-foreground.png")
make_android_bg(432).save(f"{base}/android-icon-background.png")
make_android_mono(432).save(f"{base}/android-icon-monochrome.png")
make_favicon(48).save(f"{base}/favicon.png")

print("All icons generated.")
