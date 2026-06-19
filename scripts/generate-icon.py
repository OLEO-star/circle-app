"""
ファビコン/ロゴ icon.png 生成スクリプト (512x512)

src/components/RingIcon.tsx を【忠実に】移植したリングを SVG で組み立て →
Chromium で透過 PNG 化 → src/app/icon.png を上書きする。

ポイント（2026-06-18 改訂・オーナー指定の「細いリング」へ寄せる）:
- 境界を HSL 補間でブレンド（RingIcon と同じ・blendZone 0.25）→ 9色の「ハードな塊」に
  ならず、なめらかな虹色になる。
- 背景は透過。白い円台紙・円形マスク・白マージンは入れない（RingIcon と同じ見た目＝
  細い放射線リングがそのまま浮く）。
- inner 0.30 / outer 0.46・LINE_COUNT 120・lineWidth 2.5@size140 比率・round cap も RingIcon と一致。
- 9色は revcolor パレット（src/lib/departments.ts の CATEGORY_COLORS と一致）。
  12時 = 数理・情報 #4A7BF7 起点・時計回り。

依存: playwright（Chromium 同梱）, Pillow
実行: /Library/Developer/CommandLineTools/usr/bin/python3 scripts/generate-icon.py
"""
import math
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SRC_APP = ROOT / "src" / "app"
OUT_ICON = SRC_APP / "icon.png"

# revcolor パレット（= src/lib/departments.ts CATEGORY_COLORS / RingIcon と一致）
REVCOLORS = [
    "#4A7BF7",  # 青     - 数理・情報
    "#42C5D9",  # 水     - 物理・化学
    "#4CAF50",  # 緑     - 機械・材料
    "#A8D820",  # 黄緑   - 建設・環境
    "#F5EE42",  # 黄     - 生命・医療（2026-06-19 純黄寄りへ）
    "#F59B42",  # 橙     - 健康・こころ
    "#EF5350",  # 赤     - 教育・人文
    "#E05ADD",  # ピンク - 法・政治・社会（2026-06-19 紫寄りへ）
    "#7B5CF5",  # 紫     - 経済・経営
]

RENDER = 1024              # 高解像度で描いて 512 にダウンサンプリング（AA 稼ぎ）
FINAL = 512
N_CAT = len(REVCOLORS)

# RingIcon.tsx と同一比率
INNER_R = 0.30
OUTER_R = 0.46
LINE_COUNT = 120
LINE_WIDTH_RATIO = 2.5 / 140.0  # RingIcon: lineWidth 2.5 @ size 140
BLEND_ZONE = 0.25               # RingIcon と同じ


def hex_to_hsl(hex_str: str):
    r = int(hex_str[1:3], 16) / 255.0
    g = int(hex_str[3:5], 16) / 255.0
    b = int(hex_str[5:7], 16) / 255.0
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2.0
    if mx == mn:
        return (0.0, 0.0, l)
    d = mx - mn
    s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == r:
        h = ((g - b) / d + (6 if g < b else 0)) / 6.0
    elif mx == g:
        h = ((b - r) / d + 2) / 6.0
    else:
        h = ((r - g) / d + 4) / 6.0
    return (h * 360.0, s, l)


def hsl_str(h, s, l):
    return f"hsl({h:.2f}, {s * 100:.2f}%, {l * 100:.2f}%)"


def lerp_hsl(c1, c2, t):
    """RingIcon.tsx の lerpHsl を忠実移植（±180 ラップのみ・180度切替なし）。"""
    h1, s1, l1 = c1
    h2, s2, l2 = c2
    dh = h2 - h1
    if dh > 180:
        dh -= 360
    if dh < -180:
        dh += 360
    h = ((h1 + dh * t) % 360 + 360) % 360
    s = s1 + (s2 - s1) * t
    l = l1 + (l2 - l1) * t
    return hsl_str(h, s, l)


def build_svg() -> str:
    cx = cy = RENDER / 2.0
    inner = RENDER * INNER_R
    outer = RENDER * OUTER_R
    stroke = RENDER * LINE_WIDTH_RATIO
    seg_angle = 360.0 / N_CAT
    hsls = [hex_to_hsl(c) for c in REVCOLORS]

    lines = []
    for i in range(LINE_COUNT):
        angle_deg = (i / LINE_COUNT) * 360.0
        angle_rad = math.radians(angle_deg - 90.0)

        cat_pos = angle_deg / seg_angle
        cat_index = int(math.floor(cat_pos)) % N_CAT
        next_index = (cat_index + 1) % N_CAT
        frac = cat_pos - math.floor(cat_pos)

        if frac < BLEND_ZONE:
            prev_index = (cat_index - 1 + N_CAT) % N_CAT
            t = 0.5 + (frac / BLEND_ZONE) * 0.5
            color = lerp_hsl(hsls[prev_index], hsls[cat_index], t)
        elif frac > 1 - BLEND_ZONE:
            t = ((frac - (1 - BLEND_ZONE)) / BLEND_ZONE) * 0.5
            color = lerp_hsl(hsls[cat_index], hsls[next_index], t)
        else:
            color = hsl_str(*hsls[cat_index])

        x1 = cx + inner * math.cos(angle_rad)
        y1 = cy + inner * math.sin(angle_rad)
        x2 = cx + outer * math.cos(angle_rad)
        y2 = cy + outer * math.sin(angle_rad)
        lines.append(
            f'<line x1="{x1:.3f}" y1="{y1:.3f}" x2="{x2:.3f}" y2="{y2:.3f}" '
            f'stroke="{color}" stroke-width="{stroke:.3f}" stroke-linecap="round" />'
        )

    body = "\n    ".join(lines)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{RENDER}" height="{RENDER}" '
        f'viewBox="0 0 {RENDER} {RENDER}">\n    {body}\n</svg>'
    )


def render_svg_to_png(svg: str) -> Image.Image:
    html = (
        "<!doctype html><html><head><style>"
        "html,body{margin:0;padding:0;background:transparent;}"
        f"svg{{display:block;width:{RENDER}px;height:{RENDER}px;}}"
        "</style></head><body>" + svg + "</body></html>"
    )
    png_path = ROOT / "scripts" / "_icon_ring_raster.png"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": RENDER, "height": RENDER}, device_scale_factor=1
        )
        page.set_content(html, wait_until="load")
        page.screenshot(
            path=str(png_path), omit_background=True,
            clip={"x": 0, "y": 0, "width": RENDER, "height": RENDER},
        )
        browser.close()
    img = Image.open(png_path).convert("RGBA")
    png_path.unlink(missing_ok=True)
    return img


def main() -> None:
    ring = render_svg_to_png(build_svg())  # 透過・リングのみ
    final = ring.resize((FINAL, FINAL), Image.LANCZOS)
    final.save(OUT_ICON, "PNG", optimize=True)
    print(f"OK: {OUT_ICON} ({final.size[0]}x{final.size[1]}, mode={final.mode})")
    print("   RingIcon 忠実移植: 9色 revcolor・HSLブレンド・透過・白台紙/マスクなし")


if __name__ == "__main__":
    main()
