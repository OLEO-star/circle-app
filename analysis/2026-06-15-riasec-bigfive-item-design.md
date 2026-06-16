# RIASEC・Big Five に学ぶ項目設計 — ring-map（学部診断）への適用と「66問で十分か」（2026-06-15）

調査者: サイコメトリクス担当（L0・調査/ドラフトのみ。製品コードは変更していない）
対象コード: `src/lib/scoring.ts`（判定式v2）／`src/lib/questions.ts`（22軸・全質問プール）／`src/lib/departments.ts`（32学科×22軸）
照合した社内正本: `analysis/2026-06-15-adaptive-skip-recon.md`（軸→質問マップ・覚悟=reverse の定義）／`analysis/2026-06-12-question-addition-design.md`（新3軸 PURE/BIO/PROC 設計・監査）

> 用語: 「ホロラドコード」= **Holland Code（RIASEC）**、「ビッグファイブ」= **Big Five（OCEAN）**。
> このドキュメントの狙いは精度自慢ではなく、**「この診断には RIASEC / Big Five という確立した土台がある」と先生・保護者に示せる信頼性の根拠**を、出典付きで整理すること。ring-map の勝負どころは営業（面談シート・母校アタック）であり、診断はその信頼の入口。

---

## エグゼクティブサマリ（先に結論）

1. **項目数の世界標準**: 1因子あたり「2項目（最短・TIPI）／4項目（短縮・Mini-IPIP・BFI-2 facet）／8〜12項目（標準・BFI/BFI-2）／30〜48項目（精密・O\*NET長尺/NEO-PI-R）」という階段があり、**信頼性（Cronbach's α）は項目数とともに 0.4 → 0.6 → 0.8 → 0.95 と上がる**。
2. **ring-map の 66問は「短縮版として妥当」だが「軸あたりが薄い」**。22軸 × 平均3問は、TIPI（2問/因子）と Mini-IPIP（4問/因子）の中間。診断ツールとしては許容域だが、測定論的に「精密」ではない。**ただし1因子あたり項目数の議論は実応答データがあって初めて成立する。ring-map は現状すべて合成データなので、α・項目弁別力は未測定**——ここが最大の正直な限界。
3. **弱い軸**: `PROC`（mixed/sciences とも1問）、`BIO`（2問）、`LAB`（humanities で1問）が信頼性下限。加えて新軸・構造軸（PURE/BIO/PROC/NARRATIVE/JUSTICE/BODY/GRAD/ART 等）は**覚悟（reverse）項目ゼロ**で黙従バイアスに無防備。
4. **次にやるべき検証**: 22軸の実応答が貯まったら、各項目の **(a) Cronbach's α（軸内一貫性） (b) 項目-全体相関（item-total correlation, 弁別力 >.30 が目安） (c) reverse項目の機能確認**を回す。これは合成データでは原理的に不可能（後述 §A-6）。

---

# Part A: 外部リサーチ（RIASEC と Big Five の項目設計・出典付き）

## A-1. RIASEC（Holland Code）

### 起源と理論
- **John L. Holland** が 1958/1959 に提唱。職業興味は人格の表現であり、人は自分の型と職場環境が一致するとき最も満足するという理論。出典: [Wikipedia: Holland Codes](https://en.wikipedia.org/wiki/Holland_Codes)、[EBSCO: Holland's Theory of Career Choice](https://www.ebsco.com/research-starters/economics/hollands-theory-career-choice)
- **6類型**: Realistic（現実的・Doers）／Investigative（研究的・Thinkers）／Artistic（芸術的・Creators）／Social（社会的・Helpers）／Enterprising（企業的・Persuaders）／Conventional（慣習的・Organizers）。
- **六角形モデル（hexagon / circumplex）**: 6型を R→I→A→S→E→C の順に円環配置し、**型間の距離が類似度に反比例する**（=Holland の「calculus」）。隣接型ほど似て、対面型ほど異なる。付随概念に congruence（適合）/ differentiation（分化度）/ consistency（一貫性）。出典: [iResearchNet: Holland's Theory of Vocational Choice](https://career.iresearchnet.com/career-development/hollands-theory-of-vocational-choice/)
- 体系化は *Making Vocational Choices*（1973/1985/1992/1997 各版）。

### 代表尺度と「1次元あたり項目数・信頼性」
| 尺度 | 1タイプあたり項目数 | 総項目 | 信頼性（Cronbach's α） |
|---|---|---|---|
| **O\*NET Interest Profiler 長尺** | 30問/タイプ | 180 | **α .95–.97**、再検査 .91–.97 |
| **O\*NET IP 短尺** | 10問/タイプ | 60（4件法） | **α .82–.86（平均.84）**、再検査 .84–.89 |
| **Self-Directed Search (SDS)** | Activities 11＋Competencies 11＋Occupations 14 ＋自己評価 ≈ 36問+α/タイプ | 約228（True/False等） | （技術マニュアル未取得・未検証） |
| **Strong Interest Inventory (SII)** | GOT=RIASEC 6テーマ（項目は版で 244/291/317） | 版による | （GOT別αは未取得・未検証） |

- O\*NET の数字が最も一次資料で確実: [O\*NET IP 長尺 RVS PDF](https://www.onetcenter.org/dl_files/IP_RVS.pdf)、[O\*NET IP 短尺 Psychometric PDF](https://www.onetcenter.org/dl_files/IPSF_Psychometric.pdf)。
- **短縮の代償が定量化されている好例**: 30問/タイプ（α.95–.97）→ 10問/タイプ（α.82–.86）。項目を1/3にすると α が約 .13 落ちるが、**短尺の .84 でも進路カウンセリング実務には十分**とされる（同 PDF）。
- SII / SDS の α は今回の調査で一次マニュアルから取れず**未検証**（要 Strong/SDS Technical Manual）。

### 項目作成の原則（興味検査）
- 回答形式は **like / indifferent / dislike**、または興味度リッカート（SII 5件法・O\*NET 4件法）。出典: [EBSCO: Interest Inventories](https://www.ebsco.com/research-starters/psychology/interest-inventories)
- **活動ベース項目 > 職業名ベース項目**: ACT 技術基準は「職業名を含む/強く示唆する項目は使うべきでない」とする（興味と職業知識・ステレオタイプの混入を避ける）。出典: [ACT Interest Inventory Technical Manual PDF](https://www.act.org/content/dam/act/unsecured/documents/ACT-Interest-Inventory-Technical-Manual.pdf)。※SDS/SII は逆に職業名項目を意図的に使う設計思想で、ここは流派の対立。
- **項目弁別力**: 修正済み項目-自尺度相関 **>.30** が目安（同 ACT マニュアル）。

## A-2. Big Five（OCEAN）

### 起源と理論
- **語彙仮説（lexical hypothesis）**: 重要な個人差は言語に語として刻まれる。Galton（1884）→ **Allport & Odbert（1936）** が辞書から 17,953 語抽出（うち特性語 4,504）→ Cattell が因子分析で縮約（16PF）。出典: [Wikipedia: Lexical hypothesis](https://en.wikipedia.org/wiki/Lexical_hypothesis)
- **5因子の創発**: Fiske（1949）→ **Tupes & Christal（1961）** が空軍士官評定から5因子を再現 → Norman（1963）が独立に再現 → **Goldberg が1981年に「Big Five」と命名**。質問紙版は **Costa & McCrae の Five Factor Model（NEO 系）**。出典: [Wikipedia: Big Five personality traits](https://en.wikipedia.org/wiki/Big_Five_personality_traits)
- **5因子（OCEAN）**: Openness（開放性）/ Conscientiousness（誠実性）/ Extraversion（外向性）/ Agreeableness（協調性）/ Neuroticism（神経症傾向）。

### 代表尺度と「1因子あたり項目数・信頼性」
| 尺度 | 1因子あたり | 総項目 | α |
|---|---|---|---|
| **NEO-PI-R** | 48問/領域（6 facet×8問） | 240 | 領域 **.86–.95**、facet .56–.81 |
| **BFI** (John et al. 1991) | 約8–10問 | 44 | 各因子 **.73–.83**（メタ分析中央値） |
| **BFI-2** (Soto & John 2017) | 12問/領域（3 facet×4問） | 60 | 領域平均 **.86**（.81–.90）、facet 平均 .75 |
| **Mini-IPIP** (Donnellan 2006) | 4問/因子 | 20 | **約 .65–.77** |
| **TIPI** (Gosling 2003) | **2問/因子** | 10 | **.40–.73**（低いのは織り込み済み） |
| **IPIP** | 任意（50/120/300 等） | プール3000問+ | 構成尺度による |

出典: [BFI-2 一次資料 Soto & John 2017 PDF](https://www.colby.edu/wp-content/uploads/2013/08/Soto_John_2017b.pdf)、[NEO-PI-R](https://lcbc-uio.github.io/questionnaires/articles/neopir.html)、[BFI メタ分析 α](https://link.springer.com/article/10.1186/s40359-024-02271-x)、[Mini-IPIP](https://pmc.ncbi.nlm.nih.gov/articles/PMC6139243/)、[TIPI](https://novopsych.com/personality/ten-item-personality-inventory-tipi/)、[IPIP](https://en.wikipedia.org/wiki/International_Personality_Item_Pool)

### 項目作成の原則（性格検査）
- 標準形式は **リッカート同意度**（5件法・「私は〜な人だ」型）。
- **逆転項目（reverse-keyed）の役割**: 黙従バイアス（yea-saying＝内容に関係なく「あてはまる」と答える傾向）の打ち消し。BFI-2 は各領域/facet で順方向・逆方向の項目数を等しくして黙従を相殺。出典: [Soto & John 2017](https://www.colby.edu/wp-content/uploads/2013/08/Soto_John_2017b.pdf)
- **逆転項目のトレードオフ**: 順方向と逆方向を混ぜると二次的な「方法因子」が生じ得て、認知負荷増・一次元性が崩れることがある。逆転が常に有益という合意は**ない**。出典: [Psicothema](https://www.psicothema.com/pdf/4463.pdf)
- 用語: **項目弁別力**＝高低トレイト者を分ける度合い（IRT の a パラメータ）／**内容的妥当性**＝構成概念の広さをカバーしているか／**社会的望ましさバイアス**＝よく見せようとする回答傾向。

## A-3. 「1因子あたり何項目で十分か」（核心のトレードオフ）

帯域（bandwidth）/効率 vs 忠実度（fidelity）/信頼性の緊張関係:
- **2問/因子（TIPI）**: 最短。α .40–.73。時間が極端に制約される場面のみ正当化。著者自身「非常に短い尺度は誤った知見を生みやすい」と注記し、α より**内容的妥当性と再検査信頼性**で勝負。
- **4問/因子（Mini-IPIP・BFI-2 facet）**: α .60–.77。多くの用途で「許容」。
- **8–12問/因子（BFI/BFI-2）**: α .73–.86。実務の標準。
- **30–48問/因子（O\*NET長尺/NEO-PI-R）**: α .86–.97。高ステークス個人判断向け。

メカニズム: Spearman-Brown 則により**項目が減る→内一貫性が下がる→測定誤差が増える→外的基準との相関が減衰（attenuation）**。短尺は天井/床効果・粗い分布のリスクも。出典: [Soto & John 2017](https://www.colby.edu/wp-content/uploads/2013/08/Soto_John_2017b.pdf)

## A-4. 興味（RIASEC）と性格（Big Five）で設計・採点がどう違うか
- **構成概念**: Big Five＝習慣的な行動・感情・思考のパターン（特性）。RIASEC＝活動・文脈への選好（興味）。
- **回答形式**: 性格＝リッカート同意度。興味＝like/dislike や do/don't-want（SDS は228の True/False）。
- **採点と解釈**: Big Five＝5本の連続スコア（基本は正規＝対人比較）。RIASEC＝6型の**空間配置（隣接=類似）に意味があり**、上位2-3型を並べた**ホランドコード（例 "SAE"）**で解釈。つまり RIASEC は「正規採点・ipsative（個人内順位）解釈」のハイブリッド。
- **相関（別物だが関連）**: Artistic–Openness r≈.48、Enterprising–Extraversion r≈.41 等。Realistic/Conventional は Big Five と弱相関＝冗長ではない。出典: [Larson et al. の RIASEC×Big Five メタ](https://www.sciencedirect.com/science/article/abs/pii/S0191886997000044)

## A-5. 強制選択 vs リッカート（ring-map の PURE に直結）
- **正規（normative）**: 1項目ずつリッカート。対人比較可・再検査安定。
- **ipsative（強制選択）**: 選択肢間で強制的に選ぶ。スコアが個人内で定数和になり**対人比較不可・再検査信頼性が低い**。出典: [iResearchNet: Normative vs Ipsative](https://psychology.iresearchnet.com/industrial-organizational-psychology/i-o-psychology-theories/normative-vs-ipsative-measurement/)
- **示唆**: ring-map の PURE 3問は「〜よりも〜のほうが」という**比較形**だが、回答自体は5件法リッカート（純粋な ipsative ではない）。これは社会的望ましさバイアスを抑えつつ正規採点の利点を保つ折衷で、設計判断として妥当。

## A-6. 適応型テスト（CAT）/ 項目反応理論（IRT）——なぜ実データが必須か
- **IRT**: 各回答確率を潜在特性 θ と項目パラメータ（難易度 b・弁別力 a）の関数でモデル化。リッカートは Samejima の段階反応モデル（GRM）が標準。
- **CAT**: 事前較正済みの項目バンクから、現在の θ 推定に最も情報量の多い次問を逐次選び、目標精度で打ち切る。これで精度を保ったまま大幅短縮できる。
- **実データが必須の理由（ここが ring-map の現状に直結）**: 項目パラメータ（a, b）は**実回答者から推定しなければ存在しない**。弁別力・情報量は「実際の人がどう答えるか」の性質なので、**合成データからは CAT も項目弁別力も項目情報量も計算できない**。シミュレーション研究は「すでに較正済みのパラメータ」を前提に選択アルゴリズムだけを試すもので、項目較正そのものではない。
- 出典: [IRT/CAT 較正 arXiv 2108.08604](https://arxiv.org/pdf/2108.08604)、[CAT 概説](https://files.eric.ed.gov/fulltext/EJ1148445.pdf)。Big Five の実例 CAT＝TAPAS。

---

# Part B: ring-map への適用（社内コードと突き合わせ）

## B-1. 66問は測定論的に妥当か（22軸×平均3問の是非）

現行の実測（`questions.ts` をパースして集計）:

| 版 | 総問数 | 軸数 | 軸あたり平均 |
|---|---|---|---|
| mixed | 66 | 22 | 3.0 |
| humanities | 53 | 15 | 3.5 |
| sciences | 58 | 17 | 3.4 |

**世界標準のどこに位置するか**: 1因子あたり 3問は **TIPI（2問）と Mini-IPIP/BFI-2 facet（4問）の中間**。つまり ring-map は測定論的に「**短縮版（brief inventory）**」のカテゴリ。BFI（8–10問）や O\*NET（10–30問）の精密さはない。

**「軸が多い（22）×軸あたりが薄い（3）」のトレードオフ**:
- 利点: 22軸あるからこそ「化学系4学科」「情報科学⇄情報工学」のような**近接学科を分離する解像度**を確保できる（PURE/BIO/PROC 追加の根拠＝`2026-06-12-question-addition-design.md`）。学科判別という ring-map の目的には、Big Five 5因子より細かい軸構成が要る。
- 代償: 軸を増やすほど1軸あたりの問数は薄くなり、**各軸単体の信頼性（α）は構造的に下がる**。BFI-2 が「総60問で5因子＝12問/因子」を確保しているのと対照的に、ring-map は「総66問で22軸＝3問/軸」に分散している。
- **総合評価**: 学科マッチングという用途では、各軸が単体で高α である必要は薄い（最終出力は軸スコアそのものではなく、32学科ベクトルとの距離＝多数の軸を束ねた合成判断）。**「軸単体の信頼性」より「学科復元率」で評価すべき**ツール。ただし距離計算は各軸スコアを入力にするので、薄い軸のノイズは合成後も残る。3問/軸は「診断エンターテインメント＋面談の入口」としては妥当、「単独で進路を確定する高ステークス検査」としては不足、という二段の評価が正直なところ。

## B-2. 各質問がどう効いているか（scoring.ts の仕組みに即して）

`scoring.ts` の `calcAxisScores` を読むと、各質問の効き方は3層:

1. **(a) どの軸に loading するか**: 各 Question は `axisIndex` で**ちょうど1軸に単純構造（simple structure）で割り当て**られる（交差負荷なし）。Big Five の facet 構造のような階層はなく、フラットな22軸。
2. **(b) 正規化での ±レンジ寄与**: 軸スコアは軸別 min/max 正規化。順方向問は各問が `[1,5]`、reverse問は `REVERSE_MAP=[3,2,0,-2,-3]` で `[-3,+3]`。**reverse問はレンジ6、順方向問はレンジ4**で、1.5倍重い（`2026-06-12-question-addition-design.md` §6.1 で既に指摘済み。新軸は全問順方向にしてこの歪みを回避）。軸スコア = (実測和 − min) / (max − min) で 0..1 に。
3. **(c) reverse（覚悟）項目はマイナス加算で「耐性」を測る**: 「炎天下はつらい」「すぐ諦めたくなる」等に強く同意するほど軸が下がる。これは興味（好き）とは別に**その分野の負の側面への耐性**を測る設計で、`teachers/page.tsx`「好き・興味」と「耐性・覚悟」の2タイプという社内定義に対応。心理測定的には**逆転項目による黙従バイアス対策＋内容的妥当性の拡張**にあたる。

採点本体（判定式v2）では、軸スコアベクトルを**分散重み付きユークリッド距離（wL2_var, γ=0.7）**で32学科ベクトルと比較し、**必須軸ゲート**（学科の ≥0.8 軸でユーザーが 0.45 未満なら減点）で「核を欠いた偽top1」を棄却する。

**最大の限界（正直に明記）**: 上記は「設計上どう効くはず」の話。**実応答データがゼロ（すべて合成データ）なので、各項目が実際にどれだけ効いているか＝項目弁別力・軸内一貫性は未測定**。たとえば「3問中どの問が軸を最もよく代表しているか」「冗長な問はどれか」「黙従バイアスがどの軸を膨らませているか」は、合成データからは原理的に出ない（§A-6）。

**今後の道筋**: 22軸の実応答が貯まれば、各軸について
- **Cronbach's α**（軸内3問の一貫性。3問軸なら α .5〜.7 出れば短尺として上等）
- **項目-全体相関（item-total correlation）**（各問が自軸とどれだけ相関するか。<.30 の問は弁別力不足の候補）
- **reverse項目の機能確認**（順方向問と負相関しているか＝逆転が機能しているか）
が計算でき、薄い軸・効いていない問を実証的に特定できる。これが「合成データ→実データ」で初めて開く検証であり、ring-map の信頼性を**主張から実測へ**格上げする分岐点。

## B-3. 3問/軸で信頼性が不安な軸（実測ベース）

`questions.ts` 集計から、項目数が下限の軸:

| 軸 | mixed | sciences | humanities | リスク |
|---|---|---|---|---|
| **PROC** | 1問 | 1問 | — | 単一項目＝信頼性算出不能。設計上も「1問軸ゆえゲート対象外」と明記済（正しい判断） |
| **BIO** | 2問 | 2問 | — | 2問＝TIPI 水準。化学工学⇄生命化学の分離を担うのにノイズに弱い |
| **LAB** | 4問 | 4問 | **1問**（L3のみ） | 文系版で LAB が1問。文系学科の実験要素を測りきれない |
| **ART** | 3問（全順方向） | — | 3問 | 覚悟ゼロ |
| **GRAD** | 3問（全順方向） | 3問 | 3問 | 覚悟ゼロ（ただし G3 が事実上の耐性問） |

**覚悟（reverse）ゼロの軸**（`2026-06-15-adaptive-skip-recon.md` §(2) と一致）: PURE / BIO / PROC / NARRATIVE / JUSTICE / BODY / GRAD / LAB / BIZ / ART（版による）。これらは**黙従バイアス（なんでも「あてはまる」）に無防備**。Big Five で逆転項目を各因子に入れる理由がそのまま当てはまる弱点。

→ 最も危ういのは **PROC（1問）と BIO（2問）**。次いで**文系版の LAB（1問）**。さらに横断的に**新軸・構造軸の覚悟項目ゼロ**。

## B-4. 設計改善の示唆

1. **覚悟（reverse）項目の配置**: 黙従対策として、少なくとも中核軸以外にも1軸1逆転を目指す価値がある。ただし §A-2 の通り逆転は方法因子・認知負荷の副作用もあるので、全軸一律ではなく**黙従が疑われる軸（同意過多に見える軸）に絞って追加**が筋。実データでどの軸が膨らむか見てから入れるのが理想。
2. **強制選択（比較形）の活用**: PURE で既に「〜よりも〜のほう」を採用済み。これは社会的望ましさバイアスを抑える正攻法（§A-5）。BIO/PROC のような薄い軸にも比較形を入れると、少問数でも識別力を補える可能性がある（ただし純粋 ipsative にしないこと＝対人比較を壊さない）。
3. **②適応スキップ（最低値補完）は測定論的に許容されるか**:
   - **概ね許容**。「同一軸の最初の2問が否定側→残りをスキップして最低値を補完」は、興味検査で「明確に好きでない領域は深掘りしない」という適応の発想に沿う。判定式v2の正規化は与えられた問だけで min/max を組むので、スキップ分を最低値で埋める設計（`2026-06-15-adaptive-skip-recon.md` D3）は正規化前提を壊さない。
   - **ただし CAT とは別物**であることに注意。本物の CAT は IRT 項目情報量で次問を選ぶ（実データ較正必須＝§A-6）。ring-map の②は**ヒューリスティックな早期打ち切り**であり、IRT的最適性は保証しない。「短縮の質」を測るには、結局**スキップあり/なしで学科判定がどれだけ変わるか**を実データ（または較正済みシミュレーション）で確認する必要がある。
   - 1軸2問否定→残りスキップは、その軸の信頼性をさらに下げる（2問で確定）。**覚悟項目をスキップしてしまうと耐性情報が落ちる**ので、スキップ順序は「覚悟問を最後まで残さない／むしろ早めに出す」配置と相性が悪い点に注意。

---

# 結論: 66問で十分か

**用途を分けて答えるのが誠実。**

- **「面談の入口・進路の気づきを与える短縮版診断」としては十分**。22軸×3問＝66問は、世界標準でいえば TIPI（2問/因子）と Mini-IPIP（4問/因子）の中間に位置する**正当な短縮版（brief inventory）**であり、RIASEC（興味）と Big Five（性格・逆転項目）の確立した設計原則——単一軸への simple-structure 割り当て、リッカート＋逆転項目、比較形による望ましさバイアス対策——を踏襲している。**「思いつきの質問集」ではなく、心理測定の系譜に乗った設計だ、と先生・保護者に出典付きで示せる**（これが本ドキュメントの最大の効用）。
- **「単独で進路を確定する高ステークス検査」としては不足**。各軸3問では O\*NET（10–30問）や NEO-PI-R（48問）のような高α は望めず、PROC（1問）・BIO（2問）・文系LAB（1問）は信頼性下限。だが ring-map の最終出力は軸スコアそのものではなく**32学科ベクトルとの距離**なので、評価軸は「軸単体のα」ではなく「**学科復元率**」に置くべき——そしてそれは合成データ上の数字（化学系67%等）であり、実データでは未検証。

**だから本当の結論は「66問は短縮版として妥当な設計だが、十分かどうかは実データを取るまで分からない」**。今やるべきは問数を増やすことではなく、**22軸の実応答を貯めて α・項目-全体相関・学科復元率を実測すること**。そこで初めて「どの軸が薄すぎるか」「どの問が効いていないか」が出て、66問を**増やすべきか減らすべきか**の判断ができる。

## 次にやるべき検証（実データが入ったら）
1. **軸別 Cronbach's α**: 各軸3問の内一貫性。下限軸（PROC/BIO/LAB）を実証的に特定。
2. **項目-全体相関（弁別力）**: <.30 の問を差し替え候補に。reverse問が順方向問と負相関しているか（逆転の機能確認）。
3. **黙従バイアスの検出**: 覚悟ゼロ軸が系統的に膨らんでいないか。膨らむ軸に逆転 or 比較形を追加。
4. **学科復元率の実測**: 合成データの 67%（化学系）/ 77→85%（情報）が実データで再現するか。PURE/BIO/PROC が狙い通り分離に効いているか（項目-軸の実相関で確認）。
5. **②適応スキップの影響評価**: スキップあり/なしで top3 学科がどれだけ変わるか。覚悟問のスキップで耐性情報が落ちていないか。

---

## 出典一覧（主要）
RIASEC: [O\*NET IP 長尺 RVS](https://www.onetcenter.org/dl_files/IP_RVS.pdf)・[O\*NET IP 短尺](https://www.onetcenter.org/dl_files/IPSF_Psychometric.pdf)・[Holland Codes (Wikipedia)](https://en.wikipedia.org/wiki/Holland_Codes)・[ACT Interest Inventory Technical Manual](https://www.act.org/content/dam/act/unsecured/documents/ACT-Interest-Inventory-Technical-Manual.pdf)・[SDS (iResearchNet)](https://career.iresearchnet.com/career-assessment/self-directed-search/)
Big Five: [BFI-2 (Soto & John 2017)](https://www.colby.edu/wp-content/uploads/2013/08/Soto_John_2017b.pdf)・[NEO-PI-R](https://lcbc-uio.github.io/questionnaires/articles/neopir.html)・[BFI メタα](https://link.springer.com/article/10.1186/s40359-024-02271-x)・[Mini-IPIP](https://pmc.ncbi.nlm.nih.gov/articles/PMC6139243/)・[TIPI](https://novopsych.com/personality/ten-item-personality-inventory-tipi/)・[Lexical hypothesis](https://en.wikipedia.org/wiki/Lexical_hypothesis)・[Big Five (Wikipedia)](https://en.wikipedia.org/wiki/Big_Five_personality_traits)
横断: [RIASEC×Big Five 相関](https://www.sciencedirect.com/science/article/abs/pii/S0191886997000044)・[Normative vs Ipsative](https://psychology.iresearchnet.com/industrial-organizational-psychology/i-o-psychology-theories/normative-vs-ipsative-measurement/)・[IRT/CAT 較正](https://arxiv.org/pdf/2108.08604)・[逆転項目の副作用 (Psicothema)](https://www.psicothema.com/pdf/4463.pdf)

## 未検証フラグ（合成/二次情報ゆえ確定できなかったもの）
- SII の GOT別α・SDS の総項目数/α は一次マニュアル未取得。
- BFI 44問の因子別内訳（E8/A9/C9/N8/O10 と広く言われるが一次採点キー未確認）。
- ring-map の学科復元率・各軸αは**すべて合成データ**。実データ正解はゼロ（`2026-06-12-question-addition-design.md` §6.5 と同じ正直な限界）。
