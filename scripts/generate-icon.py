"""
ファビコン/ロゴ icon.png 生成スクリプト (512x512)

「均等9色リング（山谷なし・全色フル彩度・放射線・ラベルなし・背景透過・正方形クリーン）」を
SVG で組み立て → Chromium で透過 PNG 化 → 30px 白マージン＋全円内接の円形
アンチエイリアスマスクで src/app/icon.png を上書きする。

- 9色は revcolor パレット（src/components/RingIcon.tsx と同じ CATEGORY_COLORS）。
  12時 = 数理・情報 #4A7BF7 起点、時計回り。
- 放射線リングの見た目は RingIcon.tsx を踏襲（inner 0.3 / outer 0.46・round cap）。
- 波形（個人結果）は焼かない＝恒久ロゴとして安定。
- 円形マスク + 白マージンは commit d8522bb の仕様に倣う。

依存: playwright（Chromium 同梱）, Pillow
実行: /Library/Developer/CommandLineTools/usr/bin/python3 scripts/generate-icon.py
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SRC_APP = ROOT / "src" / "app"
OUT_ICON = SRC_APP / "icon.png"

# revcolor パレット（12時 = 数理・情報 #4A7BF7 起点・時計回り）
# = src/lib/departments.ts の CATEGORY_COLORS と一致
REVCOLORS = [
    "#4A7BF7",  # 青     - 数理・情報
    "#42C5D9",  # 水     - 物理・化学
    "#4CAF50",  # 緑     - 機械・材料
    "#A8D820",  # 黄緑   - 建設・環境
    "#F5D442",  # 黄     - 生命・医療
    "#F59B42",  # 橙     - 健康・こころ
    "#EF5350",  # 赤     - 教育・人文
    "#E05A9F",  # ピンク - 法・政治・社会
    "#7B5CF5",  # 紫     - 経済・経営
]

# --- ラスタライズ解像度（マスク前。後で 512 にダウンスケール）---
RENDER = 1024  # 高解像度で描いてからダウンサンプリングしてアンチエイリアスを稼ぐ
N_CAT = len(REVCOLORS)

# RingIcon.tsx の比率を踏襲（size 基準）
INNER_R = 0.30
OUTER_R = 0.46
LINE_COUNT = 120          # 放射線の本数（RingIcon と同じ）
LINE_WIDTH_RATIO = 2.5 / 140.0  # RingIcon: lineWidth 2.5 @ size 140

# 最終出力
FINAL = 512
WHITE_MARGIN = 30         # 全体 512 に対する白マージン（d8522bb 仕様）


def build_svg() -> str:
    """均等9色・放射線リングの SVG を生成（背景透過・正方形）。"""
    cx = cy = RENDER / 2
    inner = RENDER * INNER_R
    outer = RENDER * OUTER_R
    seg_angle = 360.0 / N_CAT
    stroke = RENDER * LINE_WIDTH_RATIO

    lines = []
    for i in range(LINE_COUNT):
        angle_deg = (i / LINE_COUNT) * 360.0
        # 12時起点・時計回り（-90deg で 12時、+ で時計回り）
        angle_rad = math.radians(angle_deg - 90.0)
        # 均等9分割：各放射線が属するセグメントの色をフル彩度でそのまま使う
        # （山谷なし＝ブレンド無し）
        cat_index = int(angle_deg // seg_angle) % N_CAT
        color = REVCOLORS[cat_index]

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
        f'viewBox="0 0 {RENDER} {RENDER}">\n'
        f"    {body}\n"
        f"</svg>"
    )


def render_svg_to_png(svg: str) -> Image.Image:
    """Chromium で SVG を透過 PNG にラスタライズして返す。"""
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
            viewport={"width": RENDER, "height": RENDER},
            device_scale_factor=1,
        )
        page.set_content(html, wait_until="load")
        # 背景透過でスクショ
        page.screenshot(path=str(png_path), omit_background=True, clip={
            "x": 0, "y": 0, "width": RENDER, "height": RENDER
        })
        browser.close()
    img = Image.open(png_path).convert("RGBA")
    png_path.unlink(missing_ok=True)
    return img


def main() -> None:
    svg = build_svg()
    ring = render_svg_to_png(svg)  # RENDER x RENDER, 透過背景・リングのみ

    # --- 白マージン付きの白正方形台紙に合成（d8522bb: 白背景＋~30px マージン）---
    # FINAL=512, margin=30 → 中身円直径 = 512 - 2*30 = 452。
    # 高解像度で組んでから 512 にダウンサンプリングする。
    up = FINAL * 2  # 1024 で台紙を作りアンチエイリアスを稼ぐ
    margin_up = WHITE_MARGIN * 2
    inner_diam = up - 2 * margin_up  # 中身（白円）の直径

    # 白い正方形台紙（不透明白）
    canvas = Image.new("RGBA", (up, up), (255, 255, 255, 255))

    # リングは台紙いっぱい（白円の内側）に収まるよう inner_diam にリサイズ。
    # ring 自体は RENDER 全面に inner0.30/outer0.46 で描いてあるので、
    # そのまま inner_diam にスケールすれば白マージン内に綺麗に収まる。
    ring_resized = ring.resize((inner_diam, inner_diam), Image.LANCZOS)
    off = (up - inner_diam) // 2
    canvas.alpha_composite(ring_resized, (off, off))

    # --- 全円内接の円形マスク（アンチエイリアス）---
    # up x up の白台紙を、外接ぴったりの円でクリップ → 角を透過。
    ss = 4  # マスクのスーパーサンプリング
    mask_big = Image.new("L", (up * ss, up * ss), 0)
    mdraw = ImageDraw.Draw(mask_big)
    mdraw.ellipse([0, 0, up * ss - 1, up * ss - 1], fill=255)
    mask = mask_big.resize((up, up), Image.LANCZOS)

    # 既存アルファとマスクを合成（リングの透過は保ったまま角だけ落とす）
    base_alpha = canvas.split()[3]
    new_alpha = Image.composite(base_alpha, Image.new("L", (up, up), 0), mask)
    canvas.putalpha(new_alpha)

    # --- 512 にダウンサンプリング ---
    final = canvas.resize((FINAL, FINAL), Image.LANCZOS)
    final.save(OUT_ICON, "PNG", optimize=True)

    print(f"OK: {OUT_ICON} ({final.size[0]}x{final.size[1]}, mode={final.mode})")
    print(f"   colors=9 revcolor, margin={WHITE_MARGIN}px, circular mask")


if __name__ == "__main__":
    main()
