import json
import math
import os

from PIL import Image, ImageDraw, ImageFont

W, H = 1600, 900
S = 2

d = json.load(open("build/preview.json"))


def font(size):
    for p in [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()


f_small = font(11 * S)
f_serif = font(15 * S)
f_logo = font(23 * S)


def rot_pt(x, y, cx, cy, a):
    c, s = math.cos(a), math.sin(a)
    return (cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c)


def draw_map(dr, m, dots, accents, ring_r=6.6):
    sc = m["w"] / 1000.0
    for x, y, r, col in dots:
        X = (m["x"] + x * sc) * S
        Y = (m["y"] + y * sc) * S
        R = max(0.6, r * sc) * S
        dr.ellipse([X - R, Y - R, X + R, Y + R], fill=tuple(int(col[i : i + 2], 16) for i in (1, 3, 5)))
    for x, y in accents:
        X = (m["x"] + x * sc) * S
        Y = (m["y"] + y * sc) * S
        R = ring_r * sc * S
        dr.ellipse([X - R, Y - R, X + R, Y + R], outline=(26, 43, 76), width=S)
        R2 = ring_r * 0.38 * sc * S
        dr.ellipse([X - R2, Y - R2, X + R2, Y + R2], fill=(26, 43, 76))


def draw_inset(dr, m, ins):
    sc = m["w"] / 1000.0
    X0 = (m["x"] + ins["x"] * sc) * S
    Y0 = (m["y"] + ins["y"] * sc) * S
    Wd = ins["w"] * sc * S
    Hd = ins["h"] * sc * S
    for i in range(0, int(Wd), 9 * S):
        dr.ellipse([X0 + i - S, Y0 - S, X0 + i + S, Y0 + S], fill=(26, 43, 76))
        dr.ellipse([X0 + i - S, Y0 + Hd - S, X0 + i + S, Y0 + Hd + S], fill=(26, 43, 76))
    for j in range(0, int(Hd), 9 * S):
        dr.ellipse([X0 - S, Y0 + j - S, X0 + S, Y0 + j + S], fill=(26, 43, 76))
        dr.ellipse([X0 + Wd - S, Y0 + j - S, X0 + Wd + S, Y0 + j + S], fill=(26, 43, 76))
    for x, y in ins["dots"]:
        X = X0 + x * sc * S
        Y = Y0 + y * sc * S
        R = max(0.8, 2.1 * sc) * S
        dr.ellipse([X - R, Y - R, X + R, Y + R], fill=(26, 43, 76))


def draw_cards(dr, cards):
    for c in cards:
        x, y, w, h, rot = c["x"], c["y"], c["w"], c["h"], math.radians(c["rot"])
        cx, cy = x + w / 2, y + h / 2
        pad = 17
        ph = h - 56
        outer = [rot_pt(x, y, cx, cy, rot), rot_pt(x + w, y, cx, cy, rot), rot_pt(x + w, y + h, cx, cy, rot), rot_pt(x, y + h, cx, cy, rot)]
        dr.polygon([(p[0] * S, p[1] * S) for p in outer], fill=(255, 255, 255))
        px1, py1, px2, py2 = x + pad, y + pad, x + w - pad, y + pad + ph
        photo = [rot_pt(px1, py1, cx, cy, rot), rot_pt(px2, py1, cx, cy, rot), rot_pt(px2, py2, cx, cy, rot), rot_pt(px1, py2, cx, cy, rot)]
        dr.polygon([(p[0] * S, p[1] * S) for p in photo], fill=(232, 228, 222))
        tx, ty = rot_pt(x + w / 2, y + pad + ph + 26, cx, cy, rot)
        dr.text((tx * S, ty * S), c["caption"].upper(), font=f_small, fill=(26, 43, 76), anchor="mm")


def render(view, path):
    img = Image.new("RGB", (W * S, H * S), (249, 248, 246))
    dr = ImageDraw.Draw(img)
    frame = round(0.021 * W * S)
    dr.rectangle([frame, frame, W * S - frame, H * S - frame], outline=(26, 43, 76, 40), width=S)
    if view == "china":
        draw_map(dr, d["china"]["map"], d["china"]["dots"], d["china"]["accents"], ring_r=9.2)
        draw_inset(dr, d["china"]["map"], d["china"]["inset"])
        fig = f"FIG. 01 — CHINA IN {len(d['china']['dots']):,} POINTS"
        serif = "of dots & the middle kingdom"
        folio = "39.90\u00b0 N — 116.40\u00b0 E"
    else:
        draw_map(dr, d["world"]["map"], d["world"]["dots"], d["world"]["accents"])
        draw_cards(dr, d["cards"])
        fig = f"FIG. 02 — THE WORLD IN {len(d['world']['dots']):,} POINTS"
        serif = "of dots & distant places"
        folio = "35.01\u00b0 N — 135.77\u00b0 E"
    dr.text((76 * S, 66 * S), "dotlas", font=f_logo, fill=(26, 43, 76), anchor="ls")
    dr.text((76 * S, 132 * S), "A QUIET ATLAS OF PLACES", font=f_small, fill=(26, 43, 76), anchor="ls")
    dr.text((1524 * S, 80 * S), "VOL. 01 — MMXXVI", font=f_small, fill=(26, 43, 76), anchor="rs")
    dr.text((76 * S, 822 * S), fig, font=f_small, fill=(26, 43, 76), anchor="ls")
    dr.text((1524 * S, 822 * S), folio, font=f_small, fill=(26, 43, 76), anchor="rs")
    dr.text((800 * S, 816 * S), serif, font=f_serif, fill=(26, 43, 76), anchor="ms")
    img = img.resize((W, H), Image.LANCZOS)
    img.save(path)
    print("saved", path)


os.makedirs("docs", exist_ok=True)
render("china", "docs/preview-china.png")
render("world", "docs/preview.png")
