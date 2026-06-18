export const meta = {
  name: 'recat-9x4-taxonomy',
  description: '36学部(32+新4)を学術的に妥当な9カテゴリ×4学部へ再編。どの新4学部を採るか＋クリーンな9群を多段で確定',
  phases: [
    { title: 'Propose', detail: '4戦略で9×4分割を並列提案' },
    { title: 'Verify', detail: '各案を敵対監査' },
    { title: 'Synthesize', detail: '統合＋8×4との優劣判定' },
  ],
}

const CANON = `正準学部名。既存32＋新規5（最終は新規から4つだけ採用＝1つ落とす）。合計36=9×4。
既存32: 数学科,情報科学科,データサイエンス学科,経済学科,経営学科,商学科,法学科,政治学科,社会学科,国際関係学科,文学科,外国語学科,哲学科,教育学科,心理学科,スポーツ科学科,医学科,薬学科,看護学科,農学科,獣医学科,機械工学科,電気電子工学科,建築学科,情報工学科,物理学科,生物学科,地球科学科,化学科,応用化学科,化学工学科,生命化学科
新規5(うち4採用): 歯学科,栄養学科,土木・都市環境工学科,経営工学科,材料工学科`

const DATA = `
# 新規5学部の最近傍（既存32の中・小=似てる。22軸類推ベクトル）
歯学科→医学科0.32,薬学科0.56,看護学科0.60,獣医学科0.67 【医療系・医学とほぼ同型】
栄養学科→医学科0.34,薬学科0.48,看護学科0.51,獣医学科0.62 【医療/健康系・歯学とほぼ重複(冗長)】
土木・都市環境工学科→機械工学科0.47,建築学科0.53,化学工学科0.62,電気電子工学科0.65 【工学・建設。孤立学部だった建築の相棒】
経営工学科→データサイエンス学科0.48,経営学科0.49,情報工学科0.50,商学科0.56 【情報×経営の橋】
材料工学科→化学工学科0.22,電気電子工学科0.26,応用化学科0.35,機械工学科0.37 【材料・化学工学系。5新規で最も強く嵌まる】

# どれを落とすか: 9×4 balanced k-means の平均グループ内距離（小=凝集良。参考に8×4は0.66）
落とす栄養=0.595(最良) / 落とす歯学=0.602 / 落とす経営工=0.614 / 落とす材料=0.614 / 落とす土木=0.641(最悪)
→ データ示唆: 土木・材料・経営工は採用ほぼ確定（落とすと悪化）。歯学と栄養は医療系で重複、片方を落とす。栄養を落とすのがわずかに最良。

# 既存32の最近傍3（22軸距離）
数学科→物理学科0.30,情報科学科0.60,経済学科0.61 / 情報科学科→情報工学科0.28,データサイエンス学科0.35 / データサイエンス学科→情報科学科0.35,情報工学科0.37,経済学科0.43
経済学科→データ0.43,政治0.50,商0.54 / 経営学科→商0.26,経済0.60 / 商学科→経営0.26,経済0.54
法学科→政治0.53,国際関係0.79 / 政治学科→国際関係0.49,社会0.49 / 社会学科→国際関係0.43,政治0.49,地球科学0.54 / 国際関係学科→外国語0.36,社会0.43
文学科→哲学0.36,外国語0.54 / 外国語学科→国際関係0.36,文学0.54 / 哲学科→文学0.36,外国語0.63
教育学科→看護0.64,スポーツ0.65 / 心理学科→薬0.57,教育0.70,スポーツ0.71 / スポーツ科学科→教育0.65,心理0.71
医学科→看護0.49,薬0.58,獣医0.58 / 薬学科→心理0.57,医0.58,獣医0.74 / 看護学科→医0.49,教育0.64 / 獣医学科→医0.58,薬0.74
農学科→生物0.30,地球0.61,生命化0.68 / 機械工学科→電気電子0.29,化学工学0.42 / 電気電子工学科→機械0.29,化学工学0.35,応用化学0.49 / 建築学科→機械0.69(全32で最孤立) / 情報工学科→情報科学0.28,データ0.37,機械0.52
物理学科→数学0.30,化学0.48 / 生物学科→農0.30,生命化0.56,地球0.63 / 地球科学科→社会0.54,農0.61,生物0.63 / 化学科→応用化学0.27,生命化0.48,物理0.48 / 応用化学科→化学0.27,化学工学0.37,生命化0.44 / 化学工学科→電気電子0.35,応用化学0.37,機械0.42 / 生命化学科→応用化学0.44,化学0.48,生物0.56

# k-means候補（落とす栄養・cohesion0.595。学術的に直す前の粗い案）
[国際関係,文学,外国語,哲学][経済,経営,商,経営工][医,看護,獣医,歯][数学,法,政治,社会][教育,心理,スポーツ,薬][情報科学,データ,情報工,土木][農,建築,生物,地球科学][機械,電気電子,化学工学,材料工][物理,化学,応用化学,生命化学]
（問題点: 数学が法政社に紛れる/土木が情報に紛れる/建築が農生地球に紛れる＝greedy由来の歪み。学術的に直す余地大）
# k-means候補（落とす歯学・0.602）
[政治,社会,国際関係,外国語][経済,経営,商,経営工][数学,法,文学,哲学][医,看護,獣医,栄養][教育,心理,スポーツ,薬][情報科学,データ,情報工,土木][農,建築,生物,地球科学][機械,電気電子,化学工学,材料工][物理,化学,応用化学,生命化学]

# 改善対象＝確定済み8×4の妥協（9×4はこれらを解消したい）
8×4推奨: [数理情報:数学,物理,情報科学,情報工][工学:電気電子,機械,化学工学,建築][化学生命:化学,応用化学,生命化学,生物][医療:薬,看護,医,獣医][教育こころ:農,心理,スポーツ,教育][経済データ:データ,経済,経営,商][法政社][言語人文地球:哲学,文学,地球,外国語]
8×4の妥協4点: ①建築が孤立(相棒なし) ②農が教育系に浮く(本来は生物の隣) ③地球が言語人文に名目配置 ④データが経済に押し込まれ(本来は情報)
→ 9×4では: 土木が建築の相棒に／材料が機械電気と材料群／経営工が経済群へ／データが情報に戻れる/農と地球と生物が自然科学側で繋がれる、等で妥協を減らせるはず。

# 強い塊（崩さない）
- 医療: 医・薬・看護・獣医(+歯)。歯を入れると5になり1溢れる→薬を健康/心理側へ出すか要判断
- 法政社: 法・政治・社会・国際関係 = ちょうど4
- 経済・経営・商 + 経営工 = ちょうど4(経営工が綺麗に嵌まる)
- 機械・電気電子・材料工・化学工学 = ものづくり/材料(全員至近・最も凝集)
- 建築・土木 = 建設の相棒ペア
- 化学コア: 化学・応用化学・生命化学(+物理 or +材料)
- 生命地球: 生物・農・地球科学・生命化学 が近い(生命化学が化学とも被る綱引き)
- 数理情報: 数学・物理・情報科学・情報工・データ(5=1溢れ)
- 人文: 文学・外国語・哲学(3) / 教育・心理・スポーツ(3)`

const PROPOSAL = {
  type: 'object',
  properties: {
    strategy: { type: 'string' },
    dropped: { type: 'string', description: '落とす新規1学部（歯学科 or 栄養学科 等）' },
    groups: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, members: { type: 'array', items: { type: 'string' } }, weak_members: { type: 'array', items: { type: 'string' } } }, required: ['name', 'members'] } },
    gradient_order: { type: 'array', items: { type: 'string' } },
    compromises: { type: 'array', items: { type: 'string' } },
  },
  required: ['strategy', 'dropped', 'groups', 'gradient_order'],
}
const FLAWS = {
  type: 'object',
  properties: {
    nonsensical_groups: { type: 'array', items: { type: 'object', properties: { group_name: { type: 'string' }, offending_member: { type: 'string' }, why: { type: 'string' } }, required: ['group_name', 'why'] } },
    coverage_ok: { type: 'boolean', description: '採用32+4=36が重複なく9群×4に入っているか' },
    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
    best_groups_worth_keeping: { type: 'array', items: { type: 'string' } },
    verdict: { type: 'string' },
  },
  required: ['nonsensical_groups', 'coverage_ok', 'severity'],
}
const FINAL = {
  type: 'object',
  properties: {
    verdict_9x4_vs_8x4: { type: 'string', description: '9×4は8×4より良いか。妥協が何個に減ったか具体的に' },
    dropped: { type: 'string' },
    recommended: {
      type: 'object',
      properties: {
        groups: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, members: { type: 'array', items: { type: 'string' } } }, required: ['name', 'members'] } },
        gradient_order: { type: 'array', items: { type: 'string' } },
      },
      required: ['groups', 'gradient_order'],
    },
    compromises: { type: 'array', items: { type: 'string' } },
    alternative: { type: 'string' },
    rationale: { type: 'string' },
  },
  required: ['verdict_9x4_vs_8x4', 'dropped', 'recommended', 'compromises'],
}

const STRATEGIES = [
  { key: 'canon', focus: '実在大学の学部編成の常識で9群を組む。理学(数物/化学/生命地球)・工学(機械材料/建設)・情報・医療・経済経営・法政・人文・教育、を4ずつに割る。高校生/先生が即納得する名前。' },
  { key: 'cohesion', focus: 'データ最近傍で最も凝集する9群×4。k-means候補の歪み(数学→法政,土木→情報,建築→農地球)を最近傍に従って正す。' },
  { key: 'fix8x4', focus: '8×4の妥協4点(建築孤立/農浮き/地球名目/データ押し込み)を9群で全部解消することを最優先。土木→建築の相棒、材料→機械電気、経営工→経済、データ→情報復帰、農地球生物を自然科学側で接続。' },
  { key: 'gradient', focus: '理系↔文系の滑らかな勾配優先で9群を環状に。隣接群が自然に繋がり一周で徐々に変化。' },
]

phase('Propose')
const proposals = (await parallel(STRATEGIES.map((s) => () =>
  agent(`あなたは大学の学部分類専門家。36学部(既存32＋新規5から4採用=1つ落とす)を「ちょうど4学部×9カテゴリ」へ再編する案を1つ作る。\n\n戦略: ${s.focus}\n\n${CANON}\n\nデータ:\n${DATA}\n\n制約:\n- 落とす新規1つを dropped に。データ示唆では栄養/歯学のどちらか(医療冗長)。土木/材料/経営工は採用推奨。\n- 各カテゴリ厳密に4学部、採用36が重複欠落なし、members は正準名厳密一致。\n- 高校生に通じる短い名前。weak_members に浮く学部。\n- gradient_order に9カテゴリ名を理系→文系のリング順で。compromises に妥協を正直に。`,
    { schema: PROPOSAL, phase: 'Propose', label: `propose:${s.key}` })
))).filter(Boolean)

phase('Verify')
const verified = await parallel(proposals.map((p, i) => () =>
  agent(`辛口学術監査官として、この9×4案を敵対的に検証。分野が全く違う同居(例:数学と法学、建築と生物、土木と情報、文学と生物)を最近傍データで全部暴く。採用36が重複なく9群×4に入っているかも確認。\n\n案(戦略=${p.strategy}, 落とす=${p.dropped}):\n${JSON.stringify(p.groups.map((g) => ({ name: g.name, members: g.members })))}\n\n参考:\n${DATA}`,
    { schema: FLAWS, phase: 'Verify', label: `verify:${STRATEGIES[i] ? STRATEGIES[i].key : i}` }).then((f) => ({ proposal: p, flaws: f }))
)).then((rs) => rs.filter(Boolean))

phase('Synthesize')
const packet = verified.map((v, i) => `=== 案${i + 1}(${v.proposal.strategy}/落とす${v.proposal.dropped}) ===\n群: ${JSON.stringify(v.proposal.groups.map((g) => ({ n: g.name, m: g.members })))}\n勾配: ${JSON.stringify(v.proposal.gradient_order)}\n妥協: ${JSON.stringify(v.proposal.compromises)}\n監査(sev=${v.flaws.severity},cov=${v.flaws.coverage_ok}): ${JSON.stringify(v.flaws.nonsensical_groups)}`).join('\n\n')

const final = await agent(`あなたはring-map主任設計者。複数の9×4案＋辛口監査を踏まえ最終推奨を1つ確定する。各案から良い群を移植してよい。\n\n必須:\n- verdict_9x4_vs_8x4: 9×4は8×4(妥協4点)より良いか。妥協が何個に減るか具体的に（8×4の建築孤立/農浮き/地球名目/データ押し込みのどれが解消したか）。\n- dropped: 落とす新規1学部を確定（医療冗長の栄養or歯学が筆頭）。\n- recommended.groups: 厳密に9群×4学部・採用36・正準名・重複欠落なし。鉄板(法政社/経済経営商経営工/機械電気材料化工)は崩さない。\n- gradient_order(9)は理系→文系で環が滑らかに。\n- compromises に残る妥協を正直に（9×4でも完全には消えないなら明記）。alternative に次点。\n\n${CANON}\n\nデータ:\n${DATA}\n\n=== 各案＋監査 ===\n${packet}`,
  { schema: FINAL, phase: 'Synthesize', effort: 'high' })

return { proposalCount: proposals.length, final }
