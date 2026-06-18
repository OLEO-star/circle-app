# リングデザイン 嗜好の蓄積（ring-designer の正本）

最終更新: 2026-06-18

> このファイルは ring-designer AI がかずきの好みを溜める場所。回を重ねるごとに精度を上げるための記憶。
> 新しい反応があったら **追記**（日付つき）。確定した好みと却下案を分けて書く。

---

## 現行デザインの事実（2026-06-13 時点）

- リングは **8カテゴリ集約**。`Ring.tsx` が 120本の放射線を引き、隣接カテゴリ間を補間 → **山谷は8個**
- 各線の長さ = カテゴリ強度（そのカテゴリの全学科 similarity 平均）を、ユーザー内 min-max 正規化（最弱0.05・最強1.0）
- 配色: humanities=暖色HSL補間 / sciences=寒色RGB補間 / mixed=8色HSL。12時 = スロット0とスロット1の境界
- 内径 size×0.16、外径 ラベル有 0.34 / 無 0.44。線幅2・round cap
- 結果画面は横スワイプ（snap-x）。縦スクロール版 demo を `result-v` に作成済み（2026-06-13）

## 確定した好み（採用・かずきが明示的に良いと言ったもの）

- **2026-06-13: リングは現状（案A・8カテゴリ集約・8山谷）で行く**とかずきが決定。第1回提案（案B細分化／案Cタコメーター／案Dバー）は**いずれも今回は不採用・保留**。
  - 含意: 「8→32山谷の細分化」「タコメーター型」「パラメータバー」は当面やらない。次にデザインを触るときは、この決定を覆す新しい理由（実ユーザーの反応など）が出てからにする。逆戻りで同じ案を出さない。
  - 提案資料は残置: `2026-06-13-ring-design-proposals.md` / `ring-mockups/`（将来の再検討用アーカイブ）。

## かずきが出した方向性（2026-06-13・本人の言葉）

- 「学部のカテゴリによってリングの大きさが変わる。これに対しパラメータ表示・リング表示・**エンジンの加速度計（タコメーター）型**表示など、様々な角度でアップデートしたい」
- 例として明示:「32学部を8カテゴリでまとめているが、**32学科をリング上に順番に並べ、32学科全ての適合度からリングを生成**する（表示形式＝ラベルは8カテゴリのままでよい）。今は8個の山谷だが、より細分化して**約32個の山谷**で構成されるデザインにする」
- → 粒度を上げる方向（8 → 32）への関心が明確。タコメーター比喩 = 振り切り感・メーター的な読み取りへの関心

## レイアウト調整の記録（result-v 縦スクロール demo）

- **2026-06-14: 詳細セクションの「間延び」を解消**（かずき指摘・スクショ `feedback-shots/2026-06-14-result-v-detail-spacing.png`）。
  - 指摘: Top3 学科詳細で「説明（主な進路など）の後に余白が開きすぎ」。
  - 原因: 全セクションが `min-h-dvh` + `items-center justify-center` で1画面高に固定 → 内容が短い学科ほど上下に大きな空白。実測でも before は全版が一律 5926px（8×約744px）に固定されていた。
  - 対応: **Page1（リング＋Top3 ヒーロー）だけ `min-h-dvh` を維持**し第一印象のインパクトを確保。Page2-4（学科詳細）・P6（ランキング）・P7（基準）・P8（FB）は `min-h-dvh`+中央寄せをやめ、`flex flex-col items-center border-t border-gray-100 px-6 py-12`（最終 P8 のみ `pb-16 pt-12`）の**自然フロー＋一定リズム**に変更。隣接ブロックの境界は天面 `border-t border-gray-100` で示す。
  - 結果: full height が内容依存に（sciences 4526 / mixed 4549 / humanities 4321px）。3版とも詳細間の空白が消え、内容の長短に関わらず一定間隔。コンソールエラー・hydration 警告なし。コミット f3148e8（push せず）。
  - **判断の原則**: 縦スクロール体験では各セクションを1画面高に固定する必要はない。固定すると「内容が短い→空白／内容が長い→見切れ」の両極に振れる。可変コンテンツ（学科数13〜32）には自然フローが正解。**リング描画・判定式・数値は不変更（今回はレイアウト/余白のみ）**。
  - 開いている問い: 詳細セクションの区切りを `border-t` の細線で十分とするか、もっと明確なカード化（背景色・角丸）にするかは、かずきの美意識次第（次回確認候補）。

## ビジュアルポリッシュ（result-v 縦スクロール demo・2026-06-17）

秘書から「縦スクロール版の仕上げ4点」を依頼され実装（`/result-v` のみ・`/result` 不変更・未コミット）。触ったのは `src/app/result-v/page.tsx` と `src/app/globals.css` のレイアウト/装飾のみ。判定式・スコア・Ring 描画・色補間・データ送信・DEMO_NO_POST・ハイドレーション対策（SSR null 初期化 + useEffect 読み）は一切不変更。

- **【1】区切りの統一 → カード化に寄せた（採用）**
  - 判断: 細線(`border-t border-gray-100`)とグレー角丸カードが混在していた。**カード側に一本化**。理由は (a) FB欄・基準欄が既にカードで、縦スクロールでは「離散したカード」の方が"別の話題に切り替わる"境界として線より強く読める、(b) 高校生・先生が一目でブロックを区別しやすい。Top3 詳細・他学科ランキング・基準(P7) を `bg-gray-50 / rounded-2xl / border border-gray-100` のカードに統一（FB欄は元からカードなので踏襲）。`border-t` 区切りは全廃し、セクションは自然フロー `px-6 py-6` の一定リズムに（6/14 の「間延び解消＝1画面固定をやめる」方針は維持）。box-shadow/疑似要素は不使用（border + 実 div）。
  - 改善見込み: 区切りの言語が1つになり一貫。カード枠が境界を担うので 6/14 の細線より境界が明確。
- **【2】学科への色アクセント → 左の色帯（採用）**
  - 判断: 表紙リングはカテゴリ色で描かれるのに、下の詳細は色の紐づけが無かった。各学科カードと各ランキング行の**左端に細い色帯（実 div）**を追加。色は新規に決めず **`colors = VERSION_CATEGORY_COLORS[version]` の `colors[r.slot]`**（リング描画と同じ slot→色の対応）を参照するだけ。Top3 カードは幅 6px の帯、ランキング行は幅 4px・角丸の帯。
  - 改善見込み: 「リングのこの山（色）＝この学科」が視覚で繋がる。sciences（寒色）/humanities（暖色）/mixed（8色）全版で帯色がリングと一致するのを実機確認済み。
- **【3】スクロール誘導のバウンス（採用）**
  - 判断: 静止テキスト「スクロールして詳しく見る ↓」の矢印だけを上下バウンス（振幅 6px・2秒・ease-in-out・infinite）。テキストは静止のまま矢印のみ動かし、間延びさせない。
  - **技術メモ（ハマりどころ）**: 当初 `globals.css` に直書きの `@keyframes scrollBounce` + arbitrary class（`animate-` に scrollBounce 2s を直書きする方式）で実装したが、**Tailwind v4 + Lightning CSS が「未使用」と判断して keyframe を CSSOM から除去**し、`transform` が `none` のまま動かなかった（slideUp が動くのは別ルートのクラス文字列を scanner が拾うため）。正解は **`@theme` 内に `--animate-scroll-bounce: scrollBounce ...` トークン + `@keyframes` を定義し、named utility `animate-scroll-bounce` で使う**（Tailwind 標準の spin/bounce と同じ流儀）。今後 result-v / Ring 周りで keyframe を足すときは必ずこの方式。
  - reduced-motion: `@media (prefers-reduced-motion: reduce)` で `.animate-scroll-bounce { animation: none }`。停止しても「スクロールして詳しく見る」テキストが残るので affordance は消えない。Playwright で motion ON＝translateY 0→6→0 周回 / reduce＝`none` 固定を実測確認。
- **【4】表紙の縦バランス（採用・控えめ）**
  - 判断: 表紙上部の余白が広かった。リング `size 320 → 344`（+7.5%、390px 幅カラムに収まる範囲）。タイトル `text-base → text-lg`、上余白 `py-6 → pt-4 pb-6`、見出し下マージン微縮。`justify-center` は維持（hero だけ `min-h-dvh` 全画面カバーの方針は不変更）。
  - 改善見込み: リングが主役として一段大きく・上に詰まり、第一印象のインパクト増。実機 390×844 で sciences/humanities/mixed とも表紙（リング＋Top3＋スクロール誘導）が1画面に収まるのを確認。mixed の長ラベル「法・政治・社会」も 344 でクリップせず（ラベルは size 比例配置なので 320 と相対関係不変）。

- **検証**: `npx tsc --noEmit` パス（exit 0）。Playwright で sciences/humanities/mixed の全体＋表紙 crop を再撮（`/tmp/ringshots/after_*.png`）。コンソールに hydration 警告・pageerror なし（React DevTools info と HMR connected のみ）。full height は sciences/mixed 4672px・humanities 4457px（6/14 比でカード padding 分わずかに増だが間延びは無し）。ESLint の `set-state-in-effect`(L222) は**触っていない**ハイドレーション用 setData 効果の既存指摘でこの回の回帰ではない（backup と byte 一致）。
- **退路**: 編集前に `page.tsx` / `globals.css` を `/tmp/ringshots/_backup_2026-06-17/` にバックアップ。circle-app は親 repo で未追跡のため git commit せず（巻き戻しはバックアップから）。
- **開いている問い（更新）**: 区切りは**カード化で確定**（この回でかずき提示の4点に沿って実装）。残るのは縦 vs 横（demo 判断待ち）・32山谷化の是非（6/13 の保留継続）。

## 32学部リング 再起動＋並び/レイアウト デモ（2026-06-17）

6-13 で保留した「32細分化」を**かずき本人が再起動**（保留解除の正当理由）。スクショ起点（`Downloads/スクリーンショット 2026-06-17 20.12.47.png`＝mixed 表紙）。確定した前提とデモを記録。

- **かずきの指示（本人の言葉, 2026-06-17）**:
  - 「案A・案B どちらの demo も見たい」→ 実画像で両方提示（下記）。
  - 「順序について、**22軸によるベクトルから**順序を決めたい」＝学部の並び順を22軸の似てる順で決める。
  - 「**グラデーションはそのまま**がいい」＝8カテゴリ色の流れは維持。
  - 「**96 と 128 の両方**を見たい」＝本数（LINE_COUNT）の候補 = 96(=32×3) / 128(=32×4)。
- **設計の核心（gradient維持と22軸順序の両立）**: 各学部に「自分のカテゴリ色」を与え、**学部をカテゴリ順にグループ化したまま**、カテゴリ内の順序だけを22軸（分散重み付き距離・エンジンと同じγ=0.7）で決める（アンカー付き seriation：前後カテゴリ重心に近い学部を境界に置く）。同カテゴリ隣接=同色なのでカテゴリ内は色平坦、境界だけ補間 → **現行8色グラデーションと完全一致のまま山谷だけ32に増える**。実画像でも ref8(120) と A/B の色の流れが一致するのを確認。
- **確定した並び（22軸ベクトル由来・カテゴリ順は現行維持）**: 数学→情報→データ｜経済→商→経営｜法→政治→社会→国際｜哲学→文学→外国語｜教育→スポーツ→心理｜看護→医→獣医→薬→農｜建築→情報工→機械→電気電子｜化学工→応用化学→化学→生命化学→生物→地球→物理。
  - 良い隣接が自然に出た: 12時 seam で **物理↔数学**、工学末尾**電気電子↔化学工**（自然科学先頭）。
- **2案の違い（実画像 = `analysis/ring-mockups/2026-06-17-32faculty/`）**:
  - **案A 学部均等（32×11.25°）**: 色帯が学部数に比例（自然科学7=78.75°が輪の22%・数理3=33.75%）。全学部等価でトゲが立つ＝タコメーター的な振り切り感は強いが、輪が自然科学側に膨らみ8ラベルが不均等弧に乗る。
  - **案B カテゴリ均等（8×45°＋細分化）**: 8色ホイールは現行と同じ均等配色のまま、各45°枠内を学部数で割る（3→15°/4→11.25°/5→9°/7→6.4°）。現行の見た目を保つ最小進化・ラベルは45°中央に綺麗に乗る。弱点=自然科学7学部が6.4°と細い。
  - **96 vs 128**: 96=3本/学部で歯が少し離散的に数えられる／128=4本/学部で密で滑らか・上質。
- **secretary 推奨**: レイアウト=**案B**（balanced wheel維持＋ラベル整合＋6-13承認の美意識の延長）、本数=**128**（滑らか）。ただし案Aの「振り切り感」はかずきのタコメーター志向に合うので最終はかずき判断（提示済み・回答待ち）。
- **未実装**: これはデモ（standalone SVG→PNG レンダラ `src/lib/ring_layout_demo.ts`＋`faculty_fitness_demo.ts`、本番 Ring.tsx は不変更）。A/B・本数・並び確定後に `Ring.tsx`（8→32制御点・非均等中心の補間）と `quiz/page.tsx`（calcCategoryStrengths→32学部 similarity を渡す）を改修する。

### かずきの決定（2026-06-17 続き）＋ 8×4 再編
- 本数=**128本**確定／22軸由来の並び=**承認**。
- レイアウトA/Bは「**学部カテゴリを8×4に再編すれば案A=案B（4学部×11.25°=45°）になる**」とかずきが着眼 → 8×4 再編の feasibility を多段ワークフロー（4戦略提案→敵対監査→統合, 9エージェント）で検証。
- **結論（feasibility）**: 32=8×4 は数学的には可能だが、自然な塊が4個ぴったりでないため**2〜3箇所で学術的妥協が不可避**。鉄板2群＝**医療(医・薬・看護・獣医)** と **法政社(法・政治・社会・国際関係)** は完璧に成立。
- **推奨8×4（勾配順・色は現行hue循環を割当てグラデ維持）**:
  1. 数理・情報 青: 数学/物理/情報科学/情報工　2. 工学・ものづくり 紫: 電気電子/機械/化学工学/建築
  3. 化学・生命 ピンク: 化学/応用化学/生命化学/生物　4. 医療・健康 赤: 薬/看護/医/獣医
  5. 教育・こころ・からだ 橙: 農/心理/スポーツ/教育　6. 経済・ビジネス・データ 黄: データ/経済/経営/商
  7. 法・政治・社会 緑: 政治/社会/国際関係/法　8. 言語・人文・地球 水: 哲学/文学/地球/外国語
- **避けられない妥協（要かずき判断）**: ①建築→工学（全32で最孤立・最近傍機械0.69、実在の工学部建築で納得感優先）②**農学→教育こころからだ（最大の妥協。農の真の隣は生物0.30だが化学生命を4で固めると溢れる）** ③地球科学→言語人文（データ根拠薄・名目配置。真の隣 社会0.54 は法政社の鉄板で動かせず）④データサイエンス→経済ビジネス（真の隣は情報だが数物情報5個で溢れる・DS-経済0.43）。心理は薬0.57が最近傍だが医療鉄板を崩せず教育系へ（教育/スポーツと繋がり据わり良し）。
- **画像**: `ring-mockups/2026-06-17-32faculty/`（new8x4_A/B/C・_comparison_8x4.png）。3ペルソナで形がくっきり分離するのを確認。レンダラ=`src/lib/render_8x4.ts`＋`/tmp/grouping.json`。
- **次**: かずきが8×4編成（特に妥協4点）を承認 or 微調整 → 確定後に本番 `Ring.tsx`/`quiz` と **departments.ts の categoryIndex/CATEGORY_NAMES/CATEGORY_COLORS を8×4へ改訂**（判定式・22軸スコアは不変更、カテゴリ集約の畳み方だけ変わる）。

### かずきの再検討（2026-06-17 続き2）＝ 9カテゴリ×4学部（36学部）
- かずき指示: 新規5学部（栄養/歯/土木・都市環境工/経営工/材料工）から**4つを足して36=9×4**を再検討。「学部診断のシステムが変わってもいい・9の方が良ければシステム自体変更する」。
- 新規4学部の22軸は既存近縁からの**類推**（実データ未検証）。`src/lib/recat_9x4.ts`（どれを落とすか）＋`render_grouping.ts`（v2を36集合で再計算して描画）。多段ワークフロー（4戦略→敵対監査→統合, 9エージェント）で確定。
- **どれを落とすか**: balanced k-means 凝集で 落とす栄養=0.595(最良)／歯0.602／経営工0.614／材料0.614／**土木0.641(最悪=土木は最重要)**。栄養と歯は医療でほぼ重複→**栄養を落とす**。材料(化工0.22)・土木(建築の相棒)・経営工(経営0.49)は採用ほぼ確定。
- **9×4 vs 8×4 判定（ワークフロー結論）**: **9×4が明確に優位**。8×4の妥協4点中3点解消＋1点軽減、新規1点増（実質4→2.5）。①建築孤立→土木を相棒に『建設・環境』で解消 ②データ→『数理・情報』復帰（情報工↔情報科学0.28温存）③農→生物とリング隣接(seam)で改善 ④地球→自然科学側へ格上げ（据え置きだが人文より妥当）。新規妥協=歯採用で医療5溢れ→薬を『健康・こころ』へ。
- **推奨9×4（勾配順・色=現行hue循環に黄緑#A8D820を挿入し9色平滑）**:
  1.数理・情報 青: 数学/情報科学/データ/情報工　2.物理・化学 紫: 物理/化学/応用化学/生命化学
  3.機械・材料 ピンク: 機械/電気電子/化学工学/材料工　4.建設・環境 赤: 建築/土木/地球科学/農学
  5.生命・医療 橙: 生物/医/歯/獣医　6.健康・こころ 黄: 薬/看護/心理/スポーツ
  7.教育・人文 黄緑: 教育/文学/哲学/外国語　8.法・政治・社会 緑: 法/政治/社会/国際関係　9.経済・経営 水: 経済/経営/商/経営工
- **残る妥協（9×4でも）**: 地球科学(群内凝集最弱)／農↔生物がseamで1ステップ分断／薬の理系色が健康こころで浮く／生物が医療群に基礎科学として同居／物理が数学(0.30)と別群。いずれも分野破綻ではなく局所的。
- **画像**: `ring-mockups/2026-06-17-32faculty/new9x4_A/B/C・_comparison_9x4.png`。3ペルソナで形くっきり分離。9色グラデも平滑。
- **重大な含意**: 9×4は**診断システムの変更**を伴う＝(a)新4学部のdepartment追加（類推ベクトルの実データ検証）(b)新学部を見分ける**質問・軸の追加**（土木vs建築vs機械／経営工vs経営／材料vs化工は現22軸で分離しきれない恐れ）(c)カテゴリ9化。8×4は新学部なし・現システムのまま。

### かずきの方向性（2026-06-18）＝ 9×4 に強く前向き・ただし【未確定】
- **9×4（36学部）に強く前向きだが、まだ確定していない**。確定の前提条件＝**「22軸より軸が増える場合、追加質問がどの程度になるか」を見積もってから判断**する（かずき 2026-06-18）。デザイン（編成・色・形）は良い評価。
- 採用候補は **栄養学科を落とし**、歯学・土木・都市環境工・材料工・経営工の**4学部を追加**（診断システム自体の変更を伴う）。9カテゴリ名・並び（22軸由来）・案A=案B・144本はこの構成での前提。
- **配色＝逆順に変更**（かずき指示）: 数理・情報=青は12時に据え置き、以降の色順を逆転。新順 = 青/水/緑/黄緑/黄/橙/赤/ピンク/紫（旧 青/紫/ピンク/赤/橙/黄/黄緑/緑/水 の青固定＋残り反転）。つなぎ目 紫→青 も隣接で滑らか。`grouping_9x4_revcolor.json`。
- **山谷の形状＝丸み化**（かずき指示）: 山谷の位置・高さ（距離）は不変のまま、`render_grouping.ts` の補間を**直線→コサイン補間**に変更（各頂点で傾き0＝先端が `<`→`(`）。画像 `new9x4round_A/B/C.png`・比較 `_compare_round.png`。さらに強める案（smootherstep/スプライン or 本数増 144→216/288）も提示済み・かずき判断待ち。
- **【確定・2026-06-18】最終デザイン＝`ring-mockups/2026-06-17-32faculty/new9x4r_A.png`**（かずき決定）。これに含まれる要素を本番仕様として確定する。流動だった3点（配色・本数・丸み）はすべてこの画像で確定：
  - **配色＝逆順パレット（revcolor）確定**＝`grouping_9x4_revcolor.json`。12時から 数理情報#4A7BF7(青)→物理化学#42C5D9(水)→機械材料#4CAF50(緑)→建設環境#A8D820(黄緑)→生命医療#F5D442(黄)→健康こころ#F59B42(橙)→教育人文#EF5350(赤)→法政社#E05A9F(ピンク)→経済経営#7B5CF5(紫)。色のさらなる微調整は無し（このまま）。
  - **本数＝144本 確定**（4本/学部。216/288案は不採用）。
  - **丸み＝現行のコサイン補間のまま 確定**（`render_grouping.ts` の `tt=(1-cos(tπ))/2`）。smootherstep/スプライン等のさらなる強化案は不採用。
  - **線の太さ＝現行のまま（変更しない）**。
  - 注: ファイル名の `_A` は「ペルソナA」（サンプル入力）の意味で、案A/案B（レイアウト）ではない。9×4は全カテゴリ4学部均等なので案A=案B（4×11.25°=45°）。確定するのはこの**デザインテンプレ**（色/本数/丸み/太さ/9カテゴリ割当）であり、リング形状はユーザー回答で変わる。
- ~~未確定（色の微調整）~~ → **上記で確定済み**。
- ~~**本番未実装**~~ → **2026-06-18 本番実装完了**（下節「9×4 mixedリング 本番実装」参照）。Ring.tsx 36制御点コサイン＋departments.ts 9×4＋quiz＋result-v demo まで反映・tsc/build 緑・未コミット。新学部ベクトルは06-18 実データ採取値を本番で使用。

### 軸/質問の増分見積もり（2026-06-18・かずきの確定前提条件への回答）★6大学帯シラバス実採取版
- かずきの前提条件＝「22軸より軸が増える場合、質問をどの程度増やすかを確認してから9×4を確定」。**過去制作と同じく6大学帯のシラバスから新4学部を実採取**し（類推値→実データ値）、現22軸で検証。詳細＝`analysis/2026-06-18-new4-syllabus-axis-study.md`、ツール＝`src/lib/recat_axis_check.ts`（採取値反映済み）。
- **質問数は学部数でなく軸数で決まる**（現1軸=3問）。学部が増えても軸が増えなければ質問は不変（同じ軸セットで36学部を採点するだけ）。
- **結論＝必須の新軸0本・追加質問は+0問でも成立**。新4学部は全て現22軸で一意に立つ（復元率σ=0.10で95%以上）。分離は既存軸の組合せ: 歯学=医とMAKE手技+0.60(復元100/99%)・土木=機械とFIELD+0.60/CERT+0.45(100/100%)・経営工=DSとPROC+0.40/BIZ(100/99%)・材料工=電気電子/化工とCODE/MAKE/MATH(97/**85%**)。
- **材料工のPROCを実体に合わせ0.65→0.4へ修正**＝単位操作/移動現象は材料工に無く化工固有。これで**化工との混同が解消**（真の双子は電気電子・混同13%）。新規ゆえでなく**既存の双子ペアと同水準**（σ0.15で数学↔物理90/商↔経営89%＝本番32学部にも同程度の双子）。現システム許容内。
- **頑健性を担保するなら推奨＝+2〜3問**：分離の要石 PROC軸が現在**1問しかない**（BIO=2）ため、PROC 1→3（+2）・任意でBIO 2→3（+1）＝**新軸でなく既存薄軸の増強**。新軸を立てるなら候補SOLID(固体物性)1本(+3問)だが"あれば綺麗"レベルで現時点は過剰。
- → **かずきの確定前提条件はクリア（必須新軸0本・追加質問は0〜+3問）**。9×4採用の可否はかずき判断。本番反映は GO後。

## 9×4 mixedリング 本番実装（new9x4r_A 再現・2026-06-18）★全変更の土台

確定デザイン `new9x4r_A.png`（revcolor・144本・コサイン・9×4）を**本番コードに実装**。mixed のみ 9化（sciences/humanities は 8カテゴリのまま不変）。`npx tsc --noEmit` exit0・`npm run build` 成功・未コミット（circle-app は親 repo 未追跡）。

- **★最重要の方式判断＝「学部ごと(36制御点)」方式（確定）**。確定レンダラ `src/lib/render_grouping.ts` を読んで決定。new9x4r_A は **9カテゴリ集約(strengths長9)ではなく、36学科を 22軸由来の確定順(MIXED_RING_ORDER)に並べ、各学科の適合度(similarity)を制御点として 144本のリングを描く**方式。`SEG=360/36=10°`・学科 j の中心=`(j+0.5)·10°`・**12時(0°)=seam（経営工[紫]↔数学[青]の境界）**。本番 Ring.tsx をこの方式に忠実移植し、**色 144本中 144本が `new9x4round_A.svg`（コサイン版）と完全一致(0/144 diff)** を数値検証で確認。
  - **重要な発見**: `new9x4r_A.svg`(06-17 22:31) は実は **linear** 補間版で、`new9x4round_A.svg`(06-18 01:33) が **cosine** 版（両者は境界18本だけ色が違う）。preferences の確定文（丸み=コサイン）が正なので**本番はコサインで実装**＝`new9x4round_A` と一致。new9x4r_A 自体とは境界18本だけ違う（=linear時代の名残。実害なし。最終確定はコサイン）。
  - **本番は実データscoreを使用**（`departments.ts` の6大学帯シラバス実採取値）。レンダラの embedded NEW[] は類推値なので、新4学部の山谷高さだけ 06-17 モックと微差が出るが、これは **意図した精度向上**（06-18 実データ検証の反映）。色・形状アルゴリズム・カテゴリ割当は完全一致。
- **A1 色/名称**（`departments.ts`）: `CATEGORY_NAMES`=9要素[数理・情報/物理・化学/機械・材料/建設・環境/生命・医療/健康・こころ/教育・人文/法・政治・社会/経済・経営]、`CATEGORY_COLORS`=9要素 revcolor[#4A7BF7青/#42C5D9水/#4CAF50緑/#A8D820黄緑/#F5D442黄/#F59B42橙/#EF5350赤/#E05A9Fピンク/#7B5CF5紫]。
- **A2 categoryIndex remap(全36学科)**（`departments.ts`）: 9×4 へ。新4学部の暫定値→正値(歯4/材料工2/土木3/経営工8)。`grouping_9x4_revcolor.json` と 1:1 照合・漏れゼロ。Department型コメント 0-7→0-8。scores/versions/gradExempt/sciSlot/humSlot は不変更。新規 `MIXED_RING_ORDER`(36 id・確定順)＋`MIXED_RING_CATEGORY_INDEX` を追加。
- **A3 scoring.ts**: `calcCategoryStrengths` を N可変化（`VERSION_CATEGORY_NAMES[version].length`・8ハードコード排除）。**新規 `calcMixedRingStrengths`**（36学科 similarity を MIXED_RING_ORDER 順で返す）＋統一 `calcRingStrengths`(mixed=36 / sci=hum=8)。判定式v2・22軸・ランキングは完全不変。
- **A4 Ring.tsx**: version 別に1コンポーネントで分岐。mixed=36制御点・144本・**コサイン補間** `tt=(1-cos(tπ))/2`・per-学科色（カテゴリ色を4学科ごと平坦・境界だけ HSL補間）・12時 seam・線幅2のまま。sci/hum=8制御点・120本・線形（sciences=RGB線形/humanities=HSL）を**そっくり温存**。幾何は `x=cx+r·sin(α), y=cy−r·cos(α)`(α=制御点角・時計回り)＝レンダラと同一に揃えた。
- **A5 RingIcon.tsx**: 9色化（`360/9`・`%9`・`+9` を `N_CAT=CATEGORY_COLORS.length` で）。LP の均一カラーホイールが9色 revcolor に追随。
- **A6 理系判定の学科単位化**: `SCIENCE_CATEGORY_INDICES`/`isScienceCategory` を撤去（9化で categoryIndex の意味が変わり破綻するため）。**`SCIENCE_DEPT_IDS`(versions に sciences を含む学科集合)＋`isScienceDept(id)`** を新設。call-site `result/page.tsx` L415 を `isScienceDept(r.id)` へ。新4学部(全 versions:SCI)も理系扱い。
- **付随修正（8前提の残り）**: LP・文理選択の `new Array(8).fill(0.7)` プレビューを `previewStrengths(version)`(mixed=36/sci=hum=8) に置換（`page.tsx`/`s/page.tsx`/`s/info/page.tsx`）。これがないと mixed プレビューが青〜水しか出ない8点リングになる。
- **C1 demoデータ9化(result-v のみ)**: mixed demo を 36学科(新4学部含む)・`slot`=9カテゴリindex・`categoryStrengths`=36(MIXED_RING_ORDER順)へ。sciences demo に新4学部4件を追加(slot=sciSlot 0-7 不変)。humanities demo の categoryIndex も9値へ整合（rendering は slot 参照なので無害だが整合）。`result/page.tsx` の demo は不変更（後段 D1 で置換予定なので mixed demo の旧8長 strengths は残置＝`/result?demo=mixed` は当面 8点表示。本番 quiz→result 経路は 36 で正常）。
- **quiz 追随**: `calcCategoryStrengths`→`calcRingStrengths` に差し替え（保存キー `categoryStrengths` は後方互換で名称据え置き・中身が mixed=36 に）。レイアウト不変。
- **検証**: tsc exit0／build 成功(17ページ生成)。Playwright(390×844) で result-v の mixed=9色revcolor・12時青・コサイン丸み・144本を確認（`/tmp/ringshots/r9x4_mixed_cover.png`）。sciences/humanities が従来どおり8カテゴリで壊れていないことを確認(`r9x4_sciences_cover.png`/`r9x4_humanities_cover.png`)。新4学部(歯/材料工/土木/経営工)が mixed(全36)・sciences(全24)ランキングに**正しい色帯**で出ることを確認(`r9x4_mixed_ranking.png`/`r9x4_mixed_ranking2.png`/`r9x4_sciences_ranking.png`)。本番 `/result`(sessionStorage 36長 payload 注入)も9×4で正常描画(`r9x4_prod_result_mixed.png`)。LP プレビュー9色(`r9x4_home_preview.png`)。**全ページ console/pageerror/hydration 警告なし**。
- **退路**: 編集前に Ring/RingIcon/departments/scoring を `/tmp/ringshots/_backup_2026-06-18_9x4core/` にバックアップ（※page.tsx 系は basename 衝突で1本のみ残→編集後の CURRENT も別名保存。core 4ファイルは pre-edit 完備）。**git commit せず**。
- **次の依存タスク**: D1=`result/page.tsx` の本番 demo を 9×4 36学科へ置換（今回は触らず残置）。本番公開(L2)はかずき GO 後。新4学部の本番ベクトルは実データ検証済(06-18)だが、PROC/BIO 薄軸増強(+2〜3問)は頑健性向上のオプション（未着手）。

## PC版（横型・2カラム）結果画面の実装（result-v・2026-06-17）

かずきが Claude Design で作った PC版 handoff（`/tmp/design-handoff/.../ui_kits/diagnostic-app-desktop/ResultDesktop.jsx`）を、本物の Next.js アプリ `src/app/result-v/page.tsx` に**レスポンシブ追加**した。`/result`（ライブ）・`Ring.tsx`・判定式・スコア・モバイルレイアウトは一切不変更。未コミット（巻き戻しは `/tmp/ringshots/_backup_2026-06-17_pcimpl/` のバックアップから）。

- **デザインの目的**: 高校生本人はスマホ中心だが、**先生・進路指導部は PC で結果を見る**（母校アタック・面談シートの文脈）。横幅のある画面で「リング（左固定）を見ながら右で詳細を読み比べる」体験を作り、スクロールで上下に流れるモバイルより一覧性を上げる。リング＝サービスの主役を sticky で常時見せる。
- **なぜこの変更を加えたか**: モバイルの縦1カラムは PC幅だと中央に細い1本が伸びて余白が間延びする。handoff は (a)左 sticky aside（興味マップ＋リング300＋Top3）(b)右 main（上位3詳細＝2カラムgrid／他学科ランキング＝行クリックで中央モーダル／大学の選び方＝3カラムカード／FB＝2カラムカード）という、横幅を使い切る確定仕様。これを忠実に再現した。
- **どう良くなったか**: 1440幅で sciences/humanities/mixed とも、左にリングが固定されたまま右の詳細が読める。ランキング行クリックで**中央フェードインモーダル**（モバイルのボトムシートと差別化＝PCの作法）。FB は2カラムで横に並び、右寄せの「送信する」で完結。実機スクショで一目で読み取れることを確認。
- **レスポンシブ統合の方式（重要・次回踏襲）**: `matchMedia("(min-width:1024px)")` を**マウント後の useEffect で評価し `isDesktop` を state 化**（SSR=null→マウント後に分岐）。`isDesktop` が真なら `<ResultDesktopView>` を return、それ以外（null/false）は既存モバイル JSX をそのまま return。**CSS の `hidden lg:block` 二枚出しは canvas リング二重生成・分析useEffect二重発火を招くため採らない**。状態（modal/showAll/FB）・ハンドラ（`submitSatisfaction`）・データ（`top3`/`remaining`/`colors`/`names`/`getPage7Content`/`departmentTexts`/`careerTexts`/`desiredFieldOptions`）・本物の `<Ring>`(size 300)はモバイルと完全共有。分析useEffectは `data` 依存で1回だけ発火（`isDesktop` に非依存）。`DEMO_NO_POST=true` 維持（送信オフ）。
- **モーダルの共通化**: 既存 `DeptDetailModal` に `variant` prop（`"sheet"`=モバイル下シート・既存／`"centered"`=PC中央カード）を追加。デフォルト `"sheet"` でモバイル呼び出しは挙動不変。中央版は scrim `bg-black/40`・中央配置・`max-w-[560px]`・`max-h-full`・`overflow-y-auto`・角丸2xl・fade-in 200ms・外側/×/ESCで閉じる。
- **トークン翻訳**: handoff の CSS 変数（`--text-xl`=20px 等）は持ち込まず、アプリ既存の Tailwind スケールへ翻訳（display24=なし／section20=`text-xl`／見出し18=`text-lg`／body14=`text-sm`／meta12=`text-xs`／caption10=`text-[10px]`）。box-shadow・疑似要素図形は不使用（hairline border + tint fill のみ）。ロゴは新規アセットを足さず**実 div の二重円（border-[3px]）**でリング型マークを表現。ランク/スコア色は全て `colors[r.slot]`（リング slot 色）を流用。
- **モーション**: 中央モーダルの fade-in は **`@theme` 内 `--animate-modal-fade` トークン＋`@keyframes modalFade`＋named utility `animate-modal-fade`** で定義（globals.css）。直書き @keyframes は Lightning CSS に未使用除去される件は scrollBounce と同じ流儀で回避。`prefers-reduced-motion` で停止。
- **逸脱点（仕様との差・意図的）**: ①FB欄は handoff のダミー `FeedbackBlockD`（ローカル state）ではなく**本物の共有 state＋`submitSatisfaction`＋実データの select 選択肢**に結線（demoでなく本物に、の指示優先）。気になる学部は3つ＋共通理由欄（モバイルと同内容）。②ランキングのカットオフは handoff の「8件超で さらに見る」を踏襲しつつ、表示対象は mixed/sciences のみ（humanities13学科はカット不要、モバイルと同方針）。「さらに見る（12位〜）」「11位までに戻す」。③ロゴ画像は実 div の二重円で代替（アプリにロゴアセットを持ち込まない）。
- **検証**: `tsc --noEmit` exit 0。Playwright（1440×900）で sciences/humanities/mixed の表紙＋全体、PC中央モーダル開、モバイル（390×844）でレイアウト不変を撮影（`/tmp/ringshots/pcimpl_*.png`）。コンソールに pageerror・hydration 警告なし（React DevTools info と HMR connected のみ）。`page.tsx` の diff は**削除行ゼロ＝純粋な追加のみ**でモバイルパスは byte 不変。ESLint の `set-state-in-effect`：L228(setData) は既存（不変更）、L259(setIsDesktop) は今回追加だが**既存 setData と同じ意図的パターン**（matchMedia はマウント後評価必須・ハイドレーション安全のため）で exit 0（ブロックしない）。

## スマホ「他の学科ランキング」追加表示モーダルを 中央＋色帯カード化（result-v・2026-06-18）

かずきの確定指示で、モバイルの追加表示モーダルを「**下から出るボトムシート → 画面中央に出るモーダル＋Top3 と同じ色帯カード見た目**」に改修。触ったのは `src/app/result-v/page.tsx` の `DeptDetailModal` の `variant="sheet"`（モバイル）レンダー1ブロックのみ。`/result`（ライブ）・`Ring.tsx`・判定式・スコア・色補間・PC版モーダル（`variant="centered"`）・モバイルのモーダル以外のレイアウトは一切不変更。`globals.css` も**この回は不変更**（バックアップとbyte一致）。未コミット（巻き戻しは `/tmp/ringshots/_backup_2026-06-18_mobmodal/` から）。

- **デザインの目的**: スマホで Top4 以降の学科をタップしたとき出る詳細を、表紙のリング・Top3 詳細カードと**同じ視覚言語**に揃える。ボトムシートは「一時的に下から覗く」感が強く、Top3 詳細（中央カラムのカード）と別物に見えていた。中央カード＋左色帯にすることで「これも同じ"学科カード"だ」と一目で繋がる。
- **なぜこの変更を加えたか（変更点）**:
  - 配置 `items-end` → **`items-center`**（画面中央）。scrim `bg-black/40` は維持。
  - アニメ（旧 slideUp arbitrary class・250ms ease-out） → **`animate-modal-fade`**（PC で足した `@theme` 内 `--animate-modal-fade` トークンを再利用。opacity 0→1・8px 持ち上げ・200ms。`prefers-reduced-motion` で停止＝globals.css の既存 reduced-motion 規則が `.animate-modal-fade` を `animation:none` にする）。
  - 形 `rounded-t-3xl`（上だけ角丸） → **全角丸 `rounded-2xl`**。**グラブハンドル（`h-1 w-10 bg-gray-300`）を廃止**。
  - 見た目を **Top3 カードと同一**に＝外枠 `overflow-hidden rounded-2xl border border-gray-100 bg-gray-50`、左端に **幅 `w-1.5`（6px）の色帯 `colors[dept.slot]`**（Top3 カードと同じ太さ・slot→色対応はリング描画と同一）。中身（学科について／1週間の流れ／主な進路）は不変。
  - 小画面対応: scrim に `p-5`（画面端に密着させない）・カード `max-w-sm`（スマホ幅にフィット）・`max-h-[85vh]`＋**内部スクロール**（色帯と本文を `flex` で並べ、本文側 `flex-1 overflow-y-auto px-5 pb-5 pt-4`。色帯は `shrink-0` で full-height）・縦も中央。
  - 閉じる: 外側タップ・×・ESC をすべて維持（`onClick={onClose}`＋`stopPropagation`＋既存の Escape リスナー）。本文欠落時の「準備中」フォールバックも維持。
- **PC/モバイルの出し分け方式**: 既存の `DeptDetailModal` の **variant prop を流用**（共有コンポーネント）。モバイル呼び出し（L900付近）は **デフォルト `"sheet"`** のまま＝今回 `"sheet"` のレンダー実体を中央＋色帯カードへ書き換えた。PC 呼び出し（L1537付近・`ResultDesktopView` 内）は **`variant="centered"`** で、そのレンダー実体（`max-w-[560px]`・白背景 `bg-white`・`px-8`・色帯なし）は**一切触っていない**。よって「モバイル＝中央＋gray-50＋左色帯」「PC＝中央＋白＋色帯なし」と1コンポーネント内で出し分く。`"sheet"` という variant 名は据え置き（呼び出し側を変えずに済むため）だが、中身はもうボトムシートではない点に注意。
- **Top3 カード／PC モーダルとの見た目整合**:
  - Top3 詳細カード（L544〜）＝ `overflow-hidden rounded-2xl border border-gray-100 bg-gray-50` ＋ `w-1.5` 色帯。**モバイルモーダルはこれと同一クラス**。実測でモーダルの色帯 = 6px・色は rank バッジと同色（sciences=navy `rgb(30,64,175)` / humanities=黄 `rgb(255,212,0)`）。
  - PC 中央モーダルとは「中央配置＋fade-in＋角丸2xl」の**作法を共有**しつつ、PC は白カード・色帯なし（handoff 準拠）で**差別化を維持**。スマホだけ Top3 と同じ gray-50＋色帯にする判断＝スマホは縦に Top3 カードと隣り合って読むので同じ見た目の方が繋がる。
- **検証（実測）**: `npx tsc --noEmit` exit 0。Playwright 390×844 で `?demo=sciences`/`?demo=humanities` のモーダルを開いた状態を撮影（`/tmp/ringshots/mobmodal_sciences.png`・`mobmodal_humanities.png`）。DOM 検査で scrim `items-center`＋`bg-black/40`、カード `rounded-2xl`＋`bg-gray-50`＋`animate-modal-fade`、色帯幅 6px、cardTop≈176〜188/height≈480/vh844＝縦中央、ESC で `[role=dialog]` 消滅を確認。PC 1440 で中央モーダルが従来どおり（`max-w-[560px]`・白・色帯なし・fade）開き ESC で閉じるのを確認（`mobmodal_pc_centered.png`）。モバイル全体（モーダル無し）も不変（`mobmodal_sciences_fullpage_nomodal.png`）。`/tmp/nextdev.log` に error/warn/hydration 行なし、Playwright で pageerror/console.error ゼロ。`page.tsx` の diff は `"sheet"` レンダー1ブロックのみ・他不変。
- **退路**: 編集前に `page.tsx`/`globals.css` を `/tmp/ringshots/_backup_2026-06-18_mobmodal/` にバックアップ。circle-app は親 repo で未追跡のため **git commit せず**（巻き戻しはバックアップから）。
- **技術メモ**: `slideUp` keyframe は `/result`（ライブ）の result/page.tsx L915 が今も使うので globals.css から**消さない**。result-v 側で `slideUp` を参照するのは今やコメント1行のみ。

## 却下された案（二度と逆戻りしない）

- **2026-06-18: モバイル追加表示のボトムシート（`items-end`＋`rounded-t-3xl`＋グラブハンドル＋slideUp）を廃止**。かずき指示で中央モーダル＋Top3 同型カードへ。今後モバイルの追加表示を「下から出すボトムシート」へ戻さない（中央＋色帯カードが確定）。

## 開いている問い（かずきに決めてほしい）

- 縦スクロール vs 横スワイプ（demo `result-v` を見ての判断待ち）
- 32山谷化したとき、第一印象の「自分の形」の分かりやすさは8山谷より上がるか下がるか（情報量↑ vs 一目の読みやすさ↓のトレード）
- ラベルは8カテゴリ固定でよいか、32学科の主要だけ出すか

## 2026-06-18 確定：診断前リングの常時アニメ化＋ロゴ細線化（commit 472bd71）
- **採用＝診断前のプレビューリングは「生きた」アニメ**にする（オーナー要望「パラメータが変わって長さが常に変わり続けるデザイン」「fin_mix のように」）。
- 実装＝`src/components/AnimatedRing.tsx`。各制御点の強度をランダム目標へ**コサイン ease で補間し続ける**（既定 periodMs=2600・強度下限0.15で谷が潰れない）。描画は結果リングと同じ `ring-draw.ts` の `drawRing` を毎フレーム呼ぶので**色・形は結果リングと完全同系統**（mixed=9×4・144本・HSLブレンド／sci・hum=8カテゴリ）。`prefers-reduced-motion` で静止。
- 適用先＝home hero / `/s` / `/s/info` のプレビュー（version 連動）。**結果画面の `Ring` は実データ・静止のまま不変**。
- **ロゴ/ファビコン**＝山谷を持たない均一リング（ブランドマーク）。色は9カテゴリ revcolor（=9×4）。`RingIcon` の線幅を **size 比例(2.5@140)** に変更し、小サイズ(24px ヘッダー)でも塊にならず細く見えるよう統一（ファビコン `generate-icon.py` も RingIcon 忠実移植の細線・透過）。
- 調整レバー（次に触るならここ）：`AnimatedRing` の `periodMs`（速さ）と強度レンジ（`0.15 + random*0.85`＝振れ幅）。山谷を穏やかにするなら下限↑・上限↓。
- 注意（Tailスタイル運用）：このノート内に `` `animate-[...]` `` の生トークンを書くと Tailwind が壊れCSSを生成するため**バッククォートで生のarbitrary classを書かない**（2026-06-18 実害確認済・トークンは言葉で説明する）。
