"""
OGP画像生成スクリプト (1200x630)
src/app/opengraph-image.png に出力。Next.js が自動的に <meta property="og:image"> を生成する。
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_APP = ROOT / "src" / "app"
RING_ICON = SRC_APP / "icon.png"
OUT_OGP = SRC_APP / "opengraph-image.png"
OUT_TWITTER = SRC_APP / "twitter-image.png"

# Fonts (macOS Hiragino)
FONT_BOLD = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"
FONT_REGULAR = "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"

WIDTH, HEIGHT = 1200, 630

# Colors (rose-50 family, matching the app's UI)
BG_COLOR = (255, 241, 242)  # rose-50
TEXT_PRIMARY = (31, 41, 55)  # gray-800
TEXT_SECONDARY = (75, 85, 99)  # gray-600
ACCENT = (190, 24, 93)  # rose-700


def main() -> None:
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Ring icon on the left — make white background transparent so it blends with BG
    ring = Image.open(RING_ICON).convert("RGBA")
    pixels = ring.load()
    w, h = ring.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Treat near-white pixels as transparent
            if r > 240 and g > 240 and b > 240:
                pixels[x, y] = (r, g, b, 0)
            elif r > 220 and g > 220 and b > 220:
                # Soft fade for edges to avoid jaggies
                fade = max(0, 255 - (min(r, g, b) - 220) * 12)
                pixels[x, y] = (r, g, b, fade)

    ring_size = 460
    ring = ring.resize((ring_size, ring_size), Image.LANCZOS)
    ring_x = 70
    ring_y = (HEIGHT - ring_size) // 2
    img.paste(ring, (ring_x, ring_y), ring)

    # Text on the right
    text_x = ring_x + ring_size + 70

    # Site name (small, top)
    f_site = ImageFont.truetype(FONT_REGULAR, 32)
    draw.text((text_x, 130), "ring-map", font=f_site, fill=ACCENT)

    # Title (large)
    f_title = ImageFont.truetype(FONT_BOLD, 92)
    draw.text((text_x, 180), "学部診断", font=f_title, fill=TEXT_PRIMARY)

    # Tagline 1
    f_lead = ImageFont.truetype(FONT_BOLD, 36)
    draw.text((text_x, 310), "あなたに合う学部を、", font=f_lead, fill=TEXT_PRIMARY)
    draw.text((text_x, 360), "リングで見つける。", font=f_lead, fill=TEXT_PRIMARY)

    # Subtitle (chip-ish)
    f_chip = ImageFont.truetype(FONT_REGULAR, 26)
    draw.text((text_x, 432), "32 学科  ×  19 軸  ×  60 問", font=f_chip, fill=TEXT_SECONDARY)

    # URL (bottom)
    f_url = ImageFont.truetype(FONT_REGULAR, 28)
    draw.text((text_x, 488), "https://ring-map.com", font=f_url, fill=ACCENT)

    # Save OGP image
    img.save(OUT_OGP, "PNG", optimize=True)
    # Same image for Twitter (summary_large_image accepts 1200x630)
    img.save(OUT_TWITTER, "PNG", optimize=True)

    print(f"OK: {OUT_OGP}")
    print(f"OK: {OUT_TWITTER}")


if __name__ == "__main__":
    main()
