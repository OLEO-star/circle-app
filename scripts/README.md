# scripts/ 配下の運用ノート

学部診断サイトの再生成可能スクリプトと関連ドキュメント。

## ファイル構成

```
scripts/
├── README.md                       ← このファイル
├── generate-school-data.py         ← 文科省CSV → 都道府県別JSON生成
├── data/
│   └── raw/                        ← 文科省CSV（.gitignore で除外、再ダウンロード可能）
└── apps-script/
    ├── code.gs                     ← 集計エンドポイント本体
    └── README.md                   ← デプロイ手順
```

## 文科省学校コードの定期更新ルール

### 更新頻度

文部科学省は **毎年5月1日時点** の学校コードを基準に作成し、**12月末頃に確定版を公表** する（暫定版は5月、確定版は12月）。

- **基本更新**：年1回（毎年1月）に確定版を取得
- **緊急更新**：「その他」自由入力が多発した場合のスポット対応

### 更新手順

```bash
# 1. 最新CSVのURLを確認（文科省ページから手動取得）
# https://www.mext.go.jp/b_menu/toukei/mext_01087.html

# 2. CSV を再ダウンロード（東日本版・西日本版の両方）
cd ~/home/my-company/circle-app
mkdir -p scripts/data/raw
curl -s -o scripts/data/raw/east.csv "https://www.mext.go.jp/content/YYYYMMDD-mxt_chousa01-XXXXX_2.csv"
curl -s -o scripts/data/raw/west.csv "https://www.mext.go.jp/content/YYYYMMDD-mxt_chousa01-XXXXX_4.csv"

# 3. JSON生成スクリプトを実行
/Library/Developer/CommandLineTools/usr/bin/python3 scripts/generate-school-data.py

# 4. public/schools/ 配下の差分を確認
git diff public/schools/

# 5. 動作確認（dev server）
npm run dev
# /s/select で都道府県を切り替え、新規追加校が検索できるか試す

# 6. コミット
git add public/schools/ scripts/generate-school-data.py
git commit -m "Update MEXT school master to YYYY-MM-01 snapshot"
```

### 「その他」自由入力のマージ手順

学校マスタにない学校で生徒が「その他」を選んだ場合、`school_code` は `OTHER_<手入力名>` として送信される。これを定期的に確認し、文科省マスタにある学校なら正式コードに紐付ける。

```
1. マスタSheets の diagnoses シートを開く
2. school_code 列で "OTHER_*" を絞り込み
3. 各 OTHER_xxx について、school_pref と xxx をもとに
   public/schools/{junior-high|high}-schools/{pref}.json で該当校を検索
4. 見つかれば該当校コードに置き換え（マスタSheets を手動更新 or Apps Script で一括処理）
5. 見つからなければ「文科省マスタ自体に無い学校」→ 暫定的に OTHER_ のまま運用
   （年次CSV更新で出てくる可能性あり）
```

### バージョン管理

| Snapshot | 公表日 | 取得日 | 取得元 |
|---|---|---|---|
| 令和7年5月1日時点（確定版） | 2025-12-26 | 2026-05-17 | mext.go.jp/b_menu/toukei/mext_01087.html |

新スナップショットを取得したら、この表に追記する。
