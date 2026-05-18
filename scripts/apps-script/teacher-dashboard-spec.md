# 教員ダッシュボード Phase 1 仕様

学校別 Spreadsheet 内に集計タブを自動生成する Apps Script の設計仕様。

## 背景

学校別 Spreadsheet は閲覧専用で先生に共有されるが、`students` シートの生データだけ見せても先生は「で、結局このクラスの傾向は？」が分からない。集計済みのダッシュボードタブを別途用意する。

## 目的

**先生がスプレッドシートを開いた瞬間に、自校の生徒傾向が一目で分かる状態を作る。**

## タブ構成（追加するシート）

| タブ名 | 目的 |
|---|---|
| `students` | 生データ（既存） |
| `📊 ダッシュボード` | サマリー：参加人数、完答率、最頻 Top1 学科 |
| `🏫 クラス別Top3` | クラス別の人気学科ランキング |
| `📈 19軸サマリー` | クラス平均 vs 学年平均の19軸スコア比較 |
| `👥 学年傾向` | 学年全体の Top10 学科 |

## 各タブの内容

### 📊 ダッシュボード

```
┌────────────────────────────────────────┐
│ ○○高等学校 学部診断ダッシュボード      │
│ 最終更新: 2026-XX-XX                    │
├────────────────────────────────────────┤
│ 参加人数：32名                          │
│ 1年生：12名 / 2年生：10名 / 3年生：10名 │
│                                          │
│ 最頻 Top1 学科：化学（8名）              │
│ 最頻 Top2 学科：機械工学（6名）          │
│ 最頻 Top3 学科：生物（5名）              │
│                                          │
│ 平均適合度（Top1）：78                   │
└────────────────────────────────────────┘
```

### 🏫 クラス別Top3

```
| クラス | 人数 | Top1（人気学科） | Top2 | Top3 |
|--------|------|------------------|------|------|
| 1組    | 28   | 経済（5名）      | 法学 | 経営 |
| 2組    | 30   | 化学（7名）      | 機械 | 生物 |
| 理1    | 25   | 機械（8名）      | 化学 | 情報 |
| ...    |      |                  |      |      |
```

### 📈 19軸サマリー

```
| 軸 | 全体平均 | 1組 | 2組 | 理1 | 文1 |
|----|---------|-----|-----|-----|-----|
| 興味（理学） | 3.2 | 2.8 | 3.5 | 4.1 | 2.4 |
| 興味（工学） | 3.0 | 2.7 | 3.3 | 4.0 | 2.2 |
| ... | | | | | |
```

数値はクラス毎の平均値。簡易ヒートマップとして条件付き書式で色付け（薄い→濃い）。

### 👥 学年傾向

```
| 学年 | Top1 1位 | Top1 2位 | Top1 3位 | ... |
|------|----------|----------|----------|-----|
| 1年  | 経済     | 経営     | 法学     | ... |
| 2年  | 化学     | 機械     | 生物     | ... |
| 3年  | 機械     | 情報     | 化学     | ... |
```

## 実装方針

### A. リアルタイム再計算（Apps Script のカスタム関数 or onEdit トリガー）

メリット：常に最新
デメリット：負荷増、無料枠を超えるリスク

### B. 日次バッチ集計（時間トリガー）

メリット：負荷低い、シンプル
デメリット：当日のデータは翌日反映

→ **B 推奨**：時間トリガーで毎日深夜に集計関数を実行

### 実装する関数

```javascript
function rebuildTeacherDashboard(schoolSpreadsheetId) {
  const ss = SpreadsheetApp.openById(schoolSpreadsheetId);
  const data = readStudentsSheet(ss);

  rebuildSummarySheet(ss, data);     // 📊 ダッシュボード
  rebuildClassTop3Sheet(ss, data);   // 🏫 クラス別Top3
  rebuildAxisSummarySheet(ss, data); // 📈 19軸サマリー
  rebuildGradeTrendSheet(ss, data);  // 👥 学年傾向
}

function rebuildAllTeacherDashboards() {
  const codes = Object.keys(CONFIG.SCHOOL_SHEET_MAP);
  for (const code of codes) {
    rebuildTeacherDashboard(CONFIG.SCHOOL_SHEET_MAP[code]);
  }
}

// 時間トリガー設定（手動で1回だけ実行）
function installDashboardTrigger() {
  ScriptApp.newTrigger('rebuildAllTeacherDashboards')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}
```

### 集計ロジックのポイント

- **クラス別Top3**：クラスごとに各学科の Top1 出現回数を集計、ランキング上位3つ
- **19軸サマリー**：クラスごとに axis_scores カラムをパースして平均
- **条件付き書式**：手動 or `setConditionalFormatRules` で薄ピンク〜薄緑のグラデーション

## Phase 2 への移行判断

Phase 1（Sheets内集計タブ）で先生から以下のフィードバックが出たら Phase 2（Looker Studio）に格上げ：

- 「グラフが欲しい」「棒グラフ・円グラフで見せて」
- 「印刷したい」「PDF出力したい」
- 「会議で見せたい」「スライド形式で」
- 「過去との比較グラフが欲しい」

逆に「Sheetsで十分」と言われ続ける場合は Phase 1 で運用継続。

## 実装着手の前提

- マスタSheets と最初の学校別Sheets が作成済み
- `code.gs` のデプロイが完了している
- 母校から1回でも実データが流入したらテスト可能

## 関連ファイル

- 集計エンドポイント本体：`code.gs`
- Apps Script デプロイ手順：`README.md`
- 全体戦略：`~/home/my-company/.company/secretary/notes/2026-05-17-decisions.md`
