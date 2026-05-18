# Apps Script デプロイ手順

学部診断の集計エンドポイント。`code.gs` を Google Apps Script に貼り付けて動かす。

## 必要なもの

- Google アカウント
- マスタ Spreadsheet × 1（オーナー用）
- 学校別 Spreadsheet × 学校数（教員用・閲覧専用で共有）

## 手順

### 1. マスタ Spreadsheet を作成

1. https://sheets.new で新規 Spreadsheet を作成
2. ファイル名：「学部診断 マスタ集計」
3. URL から Spreadsheet ID をコピー（`docs.google.com/spreadsheets/d/【ここがID】/edit`）

### 2. 学校別 Spreadsheet を作成（学校ごと）

1. 学校ごとに新規 Spreadsheet を作成
2. ファイル名：「学部診断 ○○高等学校」など
3. Spreadsheet ID をコピー

### 3. Apps Script プロジェクトを作成

1. マスタ Spreadsheet を開き、`拡張機能 → Apps Script`
2. 既存のコードを全削除して `code.gs` の内容を貼り付け
3. プロジェクト名：「学部診断 集計エンドポイント」

### 4. CONFIG を編集

`code.gs` の `CONFIG` 部分を編集：

```javascript
const CONFIG = {
  MASTER_SPREADSHEET_ID: 'ここにマスタSheets ID',
  SCHOOL_SHEET_MAP: {
    'D113311700073': 'ここに○○高校のSpreadsheet ID',  // 学校コード→学校別Sheets ID
    // 学校が増えたら追加
  },
  // ...（DIAGNOSES_HEADER などはそのまま）
};
```

### 5. セットアップ関数を実行

1. Apps Script のエディタで関数を選択：`setupMasterSpreadsheet`
2. 実行 → 初回は権限承認が必要（自分の Google アカウントで承認）
3. マスタ Spreadsheet を開き、`diagnoses` と `satisfactions` のシートが追加されていることを確認
4. 次に `setupSchoolSpreadsheets` を実行 → 学校別 Sheets に `students` シートが追加される

### 6. Web アプリとしてデプロイ

1. 右上の「デプロイ」→「新しいデプロイ」
2. 種類：ウェブアプリ
3. 説明：「学部診断 集計エンドポイント v1」
4. 次のユーザーとして実行：「自分」
5. アクセスできるユーザー：「全員」
6. デプロイ → URL をコピー

### 7. フロントエンドの ANALYTICS_ENDPOINT を更新

`circle-app/src/app/result/page.tsx` の以下を新しい URL に置き換える：

```typescript
const ANALYTICS_ENDPOINT = "ここに新しいデプロイURL";
```

### 8. 動作確認

1. ローカル or 本番で診断を1回完走させる
2. マスタ Spreadsheet の `diagnoses` シートに行が追加されることを確認
3. 学校モードで完走し、学校別 Spreadsheet の `students` シートに行が追加されることを確認
4. 結果ページで納得感スコアを送信し、`satisfactions` シートに行が追加されることを確認

## 学校別Sheetsの先生への共有

各学校別 Spreadsheet を：

1. 学校別 Spreadsheet を開く
2. 右上「共有」
3. 該当校の進路指導担当の先生のメールアドレスを入力
4. 権限：「閲覧者」（編集権限は与えない）
5. 「送信」

## 学校が増えたら

1. 新しい学校用 Spreadsheet を作成
2. `CONFIG.SCHOOL_SHEET_MAP` に `'学校コード': 'Spreadsheet ID'` を追記
3. `setupSchoolSpreadsheets` を再実行
4. 再デプロイ（コードを変えたら必ず再デプロイ）

## 教員ダッシュボード（Phase 1）

将来の拡張：各学校別 Spreadsheet に集計タブを自動生成する関数を追加する（別途実装予定）。  
仕様メモ：`circle-app/scripts/apps-script/teacher-dashboard-spec.md`（後日作成）
