#!/usr/bin/env python3
"""文部科学省 学校コードCSVから中学校・高校マスタJSONを生成する。

入力: scripts/data/raw/east.csv, west.csv (Shift_JIS, MEXT公式)
出力:
  public/schools/prefectures.json                  # 47都道府県メタ（中学・高校の校数つき）
  public/schools/junior-high-schools/{01..47}.json # 都道府県別 中学校データ
  public/schools/high-schools/{01..47}.json        # 都道府県別 高校データ

学校コード先頭2文字で学校種を判別:
  - C1 = 中学校
  - D1 = 高校
廃校（属性情報廃止年月日が非空）は除外する。
"""

import csv
import json
import os
from collections import defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
RAW_DIR = SCRIPT_DIR / "data" / "raw"
OUTPUT_DIR = PROJECT_ROOT / "public" / "schools"
HIGH_SCHOOL_DIR = OUTPUT_DIR / "high-schools"
JUNIOR_HIGH_DIR = OUTPUT_DIR / "junior-high-schools"

SCHOOL_TYPE_PREFIXES = {
    "junior": "C1",  # 中学校
    "high": "D1",    # 高校
}

PREFECTURES = [
    ("01", "北海道"), ("02", "青森県"), ("03", "岩手県"), ("04", "宮城県"),
    ("05", "秋田県"), ("06", "山形県"), ("07", "福島県"), ("08", "茨城県"),
    ("09", "栃木県"), ("10", "群馬県"), ("11", "埼玉県"), ("12", "千葉県"),
    ("13", "東京都"), ("14", "神奈川県"), ("15", "新潟県"), ("16", "富山県"),
    ("17", "石川県"), ("18", "福井県"), ("19", "山梨県"), ("20", "長野県"),
    ("21", "岐阜県"), ("22", "静岡県"), ("23", "愛知県"), ("24", "三重県"),
    ("25", "滋賀県"), ("26", "京都府"), ("27", "大阪府"), ("28", "兵庫県"),
    ("29", "奈良県"), ("30", "和歌山県"), ("31", "鳥取県"), ("32", "島根県"),
    ("33", "岡山県"), ("34", "広島県"), ("35", "山口県"), ("36", "徳島県"),
    ("37", "香川県"), ("38", "愛媛県"), ("39", "高知県"), ("40", "福岡県"),
    ("41", "佐賀県"), ("42", "長崎県"), ("43", "熊本県"), ("44", "大分県"),
    ("45", "宮崎県"), ("46", "鹿児島県"), ("47", "沖縄県"),
]


def parse_setup_type(field: str) -> str:
    """設置区分フィールドから 1=国/2=公/3=私 を抽出。例: "1(国)" → "1"。"""
    return field[0] if field else ""


def parse_prefecture_code(field: str) -> str:
    """都道府県番号フィールドから2桁コードを抽出。例: "01(北海道)" → "01"。"""
    return field[:2] if field else ""


def read_schools(csv_path: Path, code_prefix: str) -> list[dict]:
    """指定の学校コード先頭2文字に一致する現役レコードを抽出する。"""
    rows = []
    with csv_path.open("r", encoding="cp932", errors="replace", newline="") as f:
        reader = csv.reader(f)
        next(reader)  # ヘッダースキップ
        for row in reader:
            if len(row) < 12:
                continue
            code = row[0].strip()
            if not code.startswith(code_prefix):
                continue
            abolished = row[9].strip()
            if abolished:
                # 廃校は除外
                continue
            branch = row[4].strip()  # 本分校。9(廃) は念のため除外
            if branch.startswith("9"):
                continue
            pref_code = parse_prefecture_code(row[2])
            setup = parse_setup_type(row[3])
            name = row[5].strip()
            rows.append({
                "code": code,
                "name": name,
                "pref": pref_code,
                "type": setup,  # 1=国 / 2=公 / 3=私
            })
    return rows


def write_by_pref(schools: list[dict], out_dir: Path) -> dict[str, int]:
    """都道府県別JSONを書き出し、各都道府県の校数を返す。"""
    by_pref: dict[str, list[dict]] = defaultdict(list)
    for school in schools:
        by_pref[school["pref"]].append(school)

    out_dir.mkdir(parents=True, exist_ok=True)
    counts: dict[str, int] = {}
    for code, _name in PREFECTURES:
        items = sorted(by_pref.get(code, []), key=lambda s: s["name"])
        slim = [
            {"code": s["code"], "name": s["name"], "type": s["type"]}
            for s in items
        ]
        (out_dir / f"{code}.json").write_text(
            json.dumps(slim, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        counts[code] = len(slim)
    return counts


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    high_east = read_schools(RAW_DIR / "east.csv", SCHOOL_TYPE_PREFIXES["high"])
    high_west = read_schools(RAW_DIR / "west.csv", SCHOOL_TYPE_PREFIXES["high"])
    jr_east = read_schools(RAW_DIR / "east.csv", SCHOOL_TYPE_PREFIXES["junior"])
    jr_west = read_schools(RAW_DIR / "west.csv", SCHOOL_TYPE_PREFIXES["junior"])

    high_counts = write_by_pref(high_east + high_west, HIGH_SCHOOL_DIR)
    jr_counts = write_by_pref(jr_east + jr_west, JUNIOR_HIGH_DIR)

    # 都道府県メタ（中学・高校の両方の校数を格納）
    prefectures_meta = [
        {
            "code": code,
            "name": name,
            "junior_count": jr_counts.get(code, 0),
            "high_count": high_counts.get(code, 0),
        }
        for code, name in PREFECTURES
    ]
    (OUTPUT_DIR / "prefectures.json").write_text(
        json.dumps(prefectures_meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    high_total = sum(high_counts.values())
    jr_total = sum(jr_counts.values())
    print(f"✅ 高校マスタ: 全 {high_total} 校 / 47都道府県")
    print(f"✅ 中学マスタ: 全 {jr_total} 校 / 47都道府県")
    print(f"   出力: {OUTPUT_DIR.relative_to(PROJECT_ROOT)}/")
    # サニティチェック: 0件の都道府県があれば警告
    empty_high = [n for c, n in PREFECTURES if high_counts.get(c, 0) == 0]
    empty_jr = [n for c, n in PREFECTURES if jr_counts.get(c, 0) == 0]
    if empty_high:
        print(f"⚠️  高校0件の都道府県: {empty_high}")
    if empty_jr:
        print(f"⚠️  中学0件の都道府県: {empty_jr}")


if __name__ == "__main__":
    main()
