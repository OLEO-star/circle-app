# ②適応スキップ機能 偵察レポート（2026-06-15）

目的: 「同一軸の最初の2問が否定側 → その軸の残り質問をスキップして短縮」(②, A=否定側2連続/B=足さず短縮) の実装前偵察。
3点を確認: (1)軸→出題位置マップ (2)「最後の3問中1問は覚悟」原則の遵守 (3)ページ境界（2問→次ページに残り）の成立。

- **覚悟質問 = `reverse:true`（逆転・マイナス加算）**。出どころ＝`teachers/page.tsx`「質問は『好き・興味』と『耐性・覚悟』の2タイプ」。
- 解析スクリプト: `scripts/axis-map.mts`（一時・実行後trash）。`getQuestionsForVersion`＋`VERSION_SET_SIZES` から自動算出。

## 結論（先に3行）
1. **軸の質問は全ページに散らばっており**（同一軸連続を避ける現設計）、多くの3問軸は「2問＝前ページ／残り＝後ページ」に既に割れている＝②が効く。
2. ただし**一部の軸はスキップ対象が2問目と同じページに固まっており再配置が必要**（mixed: ANIMAL/NARRATIVE/JUSTICE/BODY、sciences: CODE/ANIMAL、humanities: CARE）。
3. **「覚悟」原則は半分しか守られていない**。中核の興味軸は最後に覚悟質問があるが、構造軸・新軸（GRAD/NARRATIVE/JUSTICE/BODY/PURE/BIO/PROC/LAB/BIZ/ART）は覚悟質問ゼロ。

## (1)(3) ページ境界の問題＝要再配置（②を全軸で効かせる場合）
※「2問目のページ ≧ スキップ対象のページ」だと、同一ページに出てしまいスキップできない。

| 版 | 軸 | 問題 |
|---|---|---|
| mixed | ANIMAL | An1(p1)/An3覚悟(p5)/An4(p5)。2問目と3問目が同p5。さらに覚悟が2問目側 |
| mixed | NARRATIVE | N1(p5)/N2(p6)/N3(p6)。2・3問目が同p6 |
| mixed | JUSTICE | J1(p5)/J2(p6)/J3(p6)。同上 |
| mixed | BODY | Bo1(p6)/Bo2(p6)/Bo3(p6)。3問とも同p6（最終ページに固まり） |
| sciences | CODE | C1(p1)/C2(p2)/C5(p2)/C4(p3)/C3覚悟(p4)。2問目C2と3問目C5が同p2 |
| sciences | ANIMAL | An1(p1)/An3覚悟(p5)/An4(p5)。2・3問目が同p5＋覚悟が2問目側 |
| humanities | CARE | Ca1(p1)/Ca4(p2)/Ca5(p2)/Ca3覚悟(p4)/Ca2(p5)。2問目Ca4と3問目Ca5が同p2 |

→ それ以外の3問以上の軸は**すでに正しく割れている**（再配置不要）。

## (2) 「覚悟（reverse）」質問が無い軸
中核の興味軸（MATH/MEMO/FIELD/CODE/MAKE/LANG/CARE/ABS/TEAM/CERT/LIFE/ANIMAL）は概ね最後に覚悟質問あり。一方:

- **mixed（覚悟ゼロ）**: LAB, BIZ, ART, GRAD, NARRATIVE, JUSTICE, BODY, PURE, BIO, PROC
- **sciences（覚悟ゼロ）**: LAB, GRAD, BODY, PURE, BIO, PROC
- **humanities（覚悟ゼロ）**: LAB, BIZ, ART, GRAD, NARRATIVE, JUSTICE, BODY

→ 新軸（PURE/BIO/PROC・2026-06-12）と構造軸（NARRATIVE/JUSTICE/BODY・04-25）、GRAD/LAB/BIZ/ART は全部「好き型」のみ。「最後の3問中1問は覚悟」は中核軸ローカルの原則で、全軸には適用されていない。

## ②の効き目（正直な評価）
- スキップ対象は「3問以上の軸の3問目以降」。多くは3問軸＝**発動時に1問だけ短縮**。4-5問軸（LAB/BIZ/FIELD/CARE/MATH/CODE/MAKE/ABS/LIFE/NARRATIVE/JUSTICE等の版別）は2-3問短縮。
- **現設計は同一軸を散らしている**ため、スキップ判定が効くのは後半ページが多い（例 mixed MATH: 2問目p3→スキップ判定はp4）。＝**短縮効果は終盤に出る**。早く軽くしたいなら各軸の2問を前方に寄せる再配置が要る（が、飽き防止の散らし設計とトレードオフ）。

## 実装前に決めること
- **D1 再配置の範囲**: (a) 上記の境界違反7件だけ直して②を全3問軸で有効化 / (b) 違反軸は②対象外として再配置しない（実装軽い・効きは部分的） / (c) 各軸の2問を前方クラスタ化して効きを最大化（大きな並べ替え・飽び防止と要バランス）
- **D2 覚悟原則**: (a) ②に覚悟は必須でないので現状受容 / (b) 覚悟ゼロ軸に覚悟質問を新規作成（authoring増・対外レビュー対象）
- **D3 採点**: スキップ分は「興味ない(最低値)」を自動入力 → 判定式v2の正規化前提を壊さない（推奨）
