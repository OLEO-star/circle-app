// 質問プール + 3バージョン対応（mixed / humanities / sciences）
//
// バージョン:
//   mixed      = 文理混合版（66問・22軸×3）
//   humanities = 文系特化版（45問・測定15軸×3）
//   sciences   = 理系特化版（51問・測定17軸×3）
//
// 2026-06-16 大改訂（八並教授「中学生にも分かりやすく」起点）:
//   ① 全測定軸を「3問ちょうど」に統一（多い軸はトリム・薄い軸＝PROC/BIO/LAB を増強）。
//      sciences 58→51 / humanities 53→45。化学系判別の主役 PROC/BIO を sciences で3問化。
//   ② 質問文を中学生向けに具体化（Claude×Codex 二重チェック。設計＝
//      analysis/2026-06-16-scihum-restructure-plan.md・-difficulty-rewrites.md）。
//   ③ 覚悟スキップ機構（SKIP_RULES）: 各軸の興味2問が両方とも「最も興味のない側」なら
//      覚悟質問を出題しない。出題順は各軸の覚悟質問を興味2問より後ろのページに配置。
//      採点では未出題の覚悟は「最も興味のない側」の値を補完（v2正規化の前提を保つ）。
//   ④ N2 は ABS への誤割当かつ Ab4 と重複のため humanities から除外（mixed のみ残置）。
//
// 軸インデックス:
//   MATH=0, MEMO=1, LAB=2, FIELD=3, CODE=4, MAKE=5, LANG=6, CARE=7
//   BIZ=8, ART=9, ABS=10, TEAM=11, CERT=12, GRAD=13, LIFE=14, ANIMAL=15
//   NARRATIVE=16, JUSTICE=17, BODY=18, PURE=19, BIO=20, PROC=21

export type Version = "mixed" | "humanities" | "sciences";

export type Question = {
  id: string;
  text: string;
  axisIndex: number;
  reverse: boolean;
  versions: Version[];
};

const ALL_QUESTIONS: Question[] = [
  // ===== MATH (0) =====
  { id: "M1", text: "公式を使って「どうしてこの答えになるのか」を自分で説明できたとき、おもしろいと感じる",
    axisIndex: 0, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "M2", text: "ふだんの生活で起きることを「数字で説明できないかな」と考えることがある",
    axisIndex: 0, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "M3", text: "計算問題がずっと続くと、途中で集中が切れてしまうほうだ",
    axisIndex: 0, reverse: true, versions: ["mixed", "humanities", "sciences"] },  // 覚悟(skippable)
  // ===== MEMO (1) =====
  { id: "Me1", text: "興味があることは、こまかい言葉の意味や知識まで、すみずみ覚えたくなる",
    axisIndex: 1, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Me2", text: "気になったテーマを、図鑑や Wikipedia で関連知識まで読み込みたくなる",
    axisIndex: 1, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Me3", text: "テスト前に大量の暗記が必要だと、気が重くなる",
    axisIndex: 1, reverse: true, versions: ["mixed", "humanities", "sciences"] },  // 覚悟(skippable)
  // ===== LAB (2) =====
  { id: "L1", text: "理科の授業で、ビーカーや試験管を使って実験する時間が好きだ",
    axisIndex: 2, reverse: false, versions: ["mixed", "sciences"] },
  { id: "L3", text: "実験が失敗しても、原因をさがしてもう一度やるのは、むしろ平気だ",
    axisIndex: 2, reverse: false, versions: ["mixed", "humanities", "sciences"] },  // 覚悟(skippable)
  { id: "L4", text: "自分で薬品を混ぜて反応を起こし、これまでにない新しい材料を作ることに興味がある",
    axisIndex: 2, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Lh1", text: "アンケートや心理テストでデータを集めて、人がどう考え・どう行動するかを調べてみたい",
    axisIndex: 2, reverse: false, versions: ["humanities"] },
  { id: "Lh2", text: "「たぶんこうだろう」で終わらせず、実際に調べて数字やデータで確かめないと納得できないほうだ",
    axisIndex: 2, reverse: false, versions: ["humanities"] },
  // ===== FIELD (3) =====
  { id: "F1", text: "教室にいるより、外に出て自分の目で見たり体験したりするほうが好きだ",
    axisIndex: 3, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "F3", text: "真夏のすごく暑い日や雨の日に、外で長い時間活動するのはつらいと思う",
    axisIndex: 3, reverse: true, versions: ["mixed", "humanities", "sciences"] },  // 覚悟(skippable)
  { id: "F4", text: "街に出て人に話を聞いたりアンケートを取ったりして、世の中のことを自分の足で調べたい",
    axisIndex: 3, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  // ===== CODE (4) =====
  { id: "C1", text: "コードを書いてアプリやゲームを動かすことに興味がある",
    axisIndex: 4, reverse: false, versions: ["mixed", "sciences"] },
  { id: "C2", text: "パソコンで「めんどうな作業を自動でやらせたり、データを調べたり」するのが楽しそうだ",
    axisIndex: 4, reverse: false, versions: ["mixed"] },
  { id: "C3", text: "パソコンで何かを作っていてうまくいかないと、すぐに諦めたくなるほうだ",
    axisIndex: 4, reverse: true, versions: ["mixed", "sciences"] },  // 覚悟(skippable)
  { id: "C5", text: "AIやデータを使って、身のまわりの困りごと（こみ具合や勉強の悩みなど）を解決してみたい",
    axisIndex: 4, reverse: false, versions: ["sciences"] },
  // ===== MAKE (5) =====
  { id: "Mk1", text: "模型や工作など、手を動かして形にする作業が好きだ",
    axisIndex: 5, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Mk2", text: "「こういう建物や製品があったらいいな」と頭の中で設計図を描くことがある",
    axisIndex: 5, reverse: false, versions: ["mixed"] },
  { id: "Mk3", text: "作品を何度もやり直すのは面倒で、早く完成させたいほうだ",
    axisIndex: 5, reverse: true, versions: ["mixed", "sciences"] },  // 覚悟(skippable)
  { id: "Mk5", text: "高いビルや長い橋が、地震や強い風でもこわれにくいのはなぜか、その理由に興味がある",
    axisIndex: 5, reverse: false, versions: ["sciences"] },
  // ===== LANG (6) =====
  { id: "Lg1", text: "外国語を学んで、海外の人とコミュニケーションを取りたい",
    axisIndex: 6, reverse: false, versions: ["mixed", "humanities"] },
  { id: "Lg2", text: "古い文章や分厚い本でも、じっくり読んで意味が分かるとうれしい",
    axisIndex: 6, reverse: false, versions: ["mixed", "humanities"] },
  { id: "Lg3", text: "毎日コツコツ単語を覚えたり文法問題を解いたりする勉強は退屈に感じる",
    axisIndex: 6, reverse: true, versions: ["mixed", "humanities"] },  // 覚悟(skippable)
  // ===== CARE (7) =====
  { id: "Ca1", text: "友達が落ち込んでいるとき、自分から声をかけて話を聞く側になることが多い",
    axisIndex: 7, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ca2", text: "後輩や友達に勉強を教えるのが得意だし、やりがいを感じる",
    axisIndex: 7, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Ca3", text: "泣いたり怒ったりしている人の前にいると、自分もつらくなって対応に困ることがある",
    axisIndex: 7, reverse: true, versions: ["mixed", "humanities", "sciences"] },  // 覚悟(skippable)
  { id: "Ca5", text: "人の話をじっくり聴いて、心の悩みに寄り添う仕事をしてみたい",
    axisIndex: 7, reverse: false, versions: ["humanities"] },
  // ===== BIZ (8) =====
  { id: "B1", text: "コンビニやお店が、どうやってお金をかせいでいるのか、そのしくみに興味がある",
    axisIndex: 8, reverse: false, versions: ["mixed", "humanities"] },
  { id: "B3", text: "文化祭の出店やフリマで、いくら売りたいか決めて工夫するのは楽しそうだ",
    axisIndex: 8, reverse: false, versions: ["mixed", "humanities"] },
  { id: "Bz4", text: "文化祭の実行委員のように、人をまとめて新しい活動を自分で始めてみたい",
    axisIndex: 8, reverse: false, versions: ["mixed", "humanities"] },
  // ===== ART (9) =====
  { id: "A1", text: "デザインや色の組み合わせなど、見た目の美しさにこだわりがある",
    axisIndex: 9, reverse: false, versions: ["mixed", "humanities"] },
  { id: "A2", text: "絵を描いたり、写真を撮ったり、自分なりの表現をするのが好きだ",
    axisIndex: 9, reverse: false, versions: ["mixed", "humanities"] },
  { id: "A3", text: "「こうすれば正解」が無いことでも、自分の感じ方・センスを信じて取り組むのは怖くない",
    axisIndex: 9, reverse: false, versions: ["mixed", "humanities"] },
  // ===== ABS (10) =====
  { id: "Ab1", text: "「自分って何だろう」「もし時間が戻せたら？」のように、答えが1つに決まらないことをあれこれ考えるのが好きだ",
    axisIndex: 10, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ab2", text: "ずっと「なんでだろう」と思っていたことの理由やしくみが分かった瞬間が、すごく好きだ",
    axisIndex: 10, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Ab3", text: "考えても考えても答えが出ない問題は、途中で投げ出したくなるほうだ",
    axisIndex: 10, reverse: true, versions: ["mixed", "humanities", "sciences"] },  // 覚悟(skippable)
  { id: "Ab5", text: "「何が正しいんだろう」「人は何のために生きるんだろう」のような、答えの出ない問いをずっと考えていたい",
    axisIndex: 10, reverse: false, versions: ["humanities"] },
  // ===== TEAM (11) =====
  { id: "T1", text: "グループで意見を出し合って進めるほうが、一人で黙々とやるより好きだ",
    axisIndex: 11, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "T2", text: "チームの中で役割分担を決めて動くのが楽しい",
    axisIndex: 11, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "T3", text: "意見が合わない人と一緒に作業すると、ストレスを感じるほうだ",
    axisIndex: 11, reverse: true, versions: ["mixed", "humanities", "sciences"] },  // 覚悟(skippable)
  // ===== CERT (12) =====
  { id: "Ce1", text: "資格を取って、それを生かした仕事のプロになりたい",
    axisIndex: 12, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ce2", text: "「この資格があれば将来も仕事に困らない」という安心感にひかれる",
    axisIndex: 12, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ce3", text: "同じ教科書を何周もするような勉強生活を何年も続けるのはつらいと思う",
    axisIndex: 12, reverse: true, versions: ["mixed", "humanities", "sciences"] },  // 覚悟(skippable)
  // ===== GRAD (13) =====
  { id: "G1", text: "一つのことを、大学に入ってからも何年もかけてとことん調べてみたい",
    axisIndex: 13, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "G2", text: "まだ誰も知らないことを研究している人の話を聞くと、自分もやってみたくなる",
    axisIndex: 13, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "G3", text: "大学を卒業したあとも、さらに数年「学校に残って研究を続ける」のも、自分はアリだと思う",
    axisIndex: 13, reverse: false, versions: ["mixed", "humanities", "sciences"] },  // 覚悟(skippable)
  // ===== LIFE (14) =====
  { id: "Li1", text: "病気やケガをした人や動物の命に、直接かかわる仕事をしたい",
    axisIndex: 14, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Li2", text: "手術の映像を見ても、「こわい」より「今どんなことをしているんだろう」と気になるほうだ",
    axisIndex: 14, reverse: false, versions: ["mixed"] },
  { id: "Li3", text: "生き物が苦しんでいる様子を目にすると、自分もつらくなって見ていられなくなる",
    axisIndex: 14, reverse: true, versions: ["mixed", "sciences"] },  // 覚悟(skippable)
  { id: "Li4", text: "病気やケガで苦しむ人を、医療の力で直接助ける仕事に就きたい",
    axisIndex: 14, reverse: false, versions: ["sciences"] },
  // ===== ANIMAL (15) =====
  { id: "An1", text: "動物のくらし方や行動をじっくり観察するのが好きだ",
    axisIndex: 15, reverse: false, versions: ["mixed", "sciences"] },
  { id: "An3", text: "動物の排泄物の処理や、汚れた環境での長時間の作業には抵抗がある",
    axisIndex: 15, reverse: true, versions: ["mixed", "sciences"] },
  { id: "An4", text: "動物が死んでしまう場面に立ち会うことがあっても、動物を助ける仕事を続けられると思う",
    axisIndex: 15, reverse: false, versions: ["mixed", "sciences"] },  // 覚悟(skippable)
  // ===== NARRATIVE (16) =====
  { id: "N1", text: "好きな小説や歌の歌詞で、作者がどうしてその言葉を選んだのかを考えるのが好きだ",
    axisIndex: 16, reverse: false, versions: ["mixed", "humanities"] },
  { id: "N2", text: "みんなが「当たり前」と思っていることでも、「本当にそうかな？」と一度疑って考えるのが好きだ",
    axisIndex: 16, reverse: false, versions: ["mixed"] },
  { id: "N3", text: "物語や一つの言葉で、人の気持ちが大きく変わるところがおもしろいと思う",
    axisIndex: 16, reverse: false, versions: ["mixed", "humanities"] },
  { id: "N4", text: "何百年も前に書かれた物語や考え方が、今でも読まれ続けているのはなぜかを考えるのが好きだ",
    axisIndex: 16, reverse: false, versions: ["humanities"] },
  // ===== JUSTICE (17) =====
  { id: "J1", text: "法律やルールの文章をきちんと読んで、「どっちが正しいか」を理由をつけて決めたい",
    axisIndex: 17, reverse: false, versions: ["mixed", "humanities"] },
  { id: "J2", text: "選挙のしくみや、政治家たちが「どうやって世の中のことを決めているのか」に興味がある",
    axisIndex: 17, reverse: false, versions: ["mixed", "humanities"] },
  { id: "J3", text: "ずるいことや不公平なことを見ると、「どうすれば公平になるか」を考えたくなる",
    axisIndex: 17, reverse: false, versions: ["mixed", "humanities"] },
  // ===== BODY (18) =====
  { id: "Bo1", text: "運動や筋肉のしくみを調べて、「もっと速く・強く動けるようにする」ことに興味がある",
    axisIndex: 18, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Bo2", text: "スポーツの戦術や試合の分析・データを見るのが好きだ",
    axisIndex: 18, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Bo3", text: "食事・睡眠・トレーニングなど、身体を整える方法に関心がある",
    axisIndex: 18, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  // ===== PURE (19) =====
  { id: "P1", text: "「これは何の役に立つの？」よりも、「そもそも、なぜそうなるの？」を知りたいタイプだ",
    axisIndex: 19, reverse: false, versions: ["mixed", "sciences"] },
  { id: "P2", text: "新しい商品を作ることよりも、もの自体がどうなっているのかを深く調べるほうが好きだ",
    axisIndex: 19, reverse: false, versions: ["mixed", "sciences"] },
  { id: "P3", text: "ゲームを完成させること自体よりも、「どういう計算で動いているんだろう」と中身のしくみを考えるほうが楽しい",
    axisIndex: 19, reverse: false, versions: ["mixed", "sciences"] },
  // ===== BIO (20) =====
  { id: "Bi1", text: "植物が日光で育ったり、食べたものが体の中でエネルギーに変わったり…そんな「生き物の中で起きていること」に興味がある",
    axisIndex: 20, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Bi2", text: "納豆やヨーグルトのように、小さな生き物の力を使って薬や食べ物を作ることに興味がある",
    axisIndex: 20, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Bi3", text: "親に似て自分の顔つきや体質が決まる「遺伝」のしくみに興味がある",
    axisIndex: 20, reverse: false, versions: ["mixed", "sciences"] },
  // ===== PROC (21) =====
  { id: "Pr1", text: "「誰が作っても同じくらい上手に、たくさん作れる方法」を考えるのが面白い",
    axisIndex: 21, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Pr2", text: "ひとつ作るのは簡単でも、それを「工場で何万個も作る」にはどうすればいいかを考えるのは面白そうだ",
    axisIndex: 21, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Pr3", text: "同じものを「安全に・むだなく・安く」作る方法を考えるのが面白そうだ",
    axisIndex: 21, reverse: false, versions: ["mixed", "sciences"] },
];

// バージョンごとの出題順（2026-06-16 再構成）。
// 覚悟(skippable)質問は各軸の興味2問より後ろのページに配置（SKIP_RULES が機能する前提）。
// 同一軸の連続配置は回避。末尾セットほど軽め（ゴール勾配）。
const VERSION_ORDERS: Record<Version, readonly string[]> = {
  mixed: [
    // セット1（11問）
    "Ce1", "A3", "Me1", "M2", "Lg1", "N3", "Ab2", "Bo3", "L4", "J1", "Li1",
    // セット2（11問）
    "P3", "Bi2", "T2", "N1", "L1", "Ab1", "An1", "Ce2", "Bi3", "J3", "T1",
    // セット3（11問）
    "Mk2", "F1", "Ca1", "G1", "B1", "C2", "Me2", "N2", "Mk1", "Bo2", "M1",
    // セット4（11問）
    "Ca2", "G2", "An3", "A2", "B3", "Pr3", "C1", "Bi1", "Li2", "P1", "J2",
    // セット5（11問）
    "A1", "F4", "Pr2", "Lg2", "Pr1", "P2", "Bz4", "Bo1", "T3", "Me3", "Mk3",
    // セット6（11問）
    "Ce3", "An4", "Lg3", "L3", "F3", "M3", "C3", "Li3", "G3", "Ca3", "Ab3",
  ],
  humanities: [
    // セット1（9問）
    "Ce1", "B1", "N1", "Lh2", "Ce2", "M1", "A1", "Ca1", "A2",
    // セット2（9問）
    "Lh1", "Lg2", "B3", "Bo1", "F4", "Lg1", "Ca5", "Ab5", "N4",
    // セット3（9問）
    "Bz4", "Me1", "Bo2", "J2", "T2", "J1", "A3", "Me2", "F1",
    // セット4（9問）
    "Bo3", "Ab1", "T1", "M2", "N3", "G1", "J3", "G2", "Ca3",
    // セット5（9問）
    "Me3", "F3", "G3", "L3", "T3", "Ab3", "Lg3", "Ce3", "M3",
  ],
  sciences: [
    // セット1（11問）
    "P2", "Bo2", "Me1", "Mk1", "M1", "Pr1", "Ab1", "F1", "Ab2", "Me2", "F4",
    // セット2（10問）
    "M2", "G1", "Li4", "L4", "Bi1", "An3", "Bo3", "An1", "Pr3", "C5",
    // セット3（10問）
    "T1", "Ca2", "T2", "C1", "Bi3", "Ca1", "P3", "Bo1", "L1", "Ce2",
    // セット4（10問）
    "G2", "Li1", "Ce1", "Bi2", "Pr2", "Mk5", "P1", "M3", "An4", "Me3",
    // セット5（10問）
    "F3", "Ce3", "G3", "Mk3", "Li3", "Ab3", "T3", "C3", "L3", "Ca3",
  ],
};

// バージョンごとのセット区切り。心理的配慮（均等化＋ゴール勾配）。
export const VERSION_SET_SIZES: Record<Version, readonly number[]> = {
  mixed:      [11, 11, 11, 11, 11, 11],
  humanities: [9, 9, 9, 9, 9],
  sciences:   [11, 10, 10, 10, 10],
};

// 覚悟スキップ定義: 同一軸の trigger 2問が両方とも「最も興味のない側」を選んだとき
// kakugo(覚悟質問)を出題しない。「最も興味のない側」= reverse質問なら5・通常なら1。
// 出題順では kakugo は triggers より後ろのページに来る（quiz が出題時に判定可能）。
export type SkipRule = { kakugo: string; triggers: [string, string] };
export const SKIP_RULES: Record<Version, readonly SkipRule[]> = {
  mixed: [
    { kakugo: "M3", triggers: ["M1", "M2"] },
    { kakugo: "L3", triggers: ["L1", "L4"] },
    { kakugo: "F3", triggers: ["F1", "F4"] },
    { kakugo: "C3", triggers: ["C1", "C2"] },
    { kakugo: "Mk3", triggers: ["Mk1", "Mk2"] },
    { kakugo: "Lg3", triggers: ["Lg1", "Lg2"] },
    { kakugo: "Ca3", triggers: ["Ca1", "Ca2"] },
    { kakugo: "Ab3", triggers: ["Ab1", "Ab2"] },
    { kakugo: "T3", triggers: ["T1", "T2"] },
    { kakugo: "Ce3", triggers: ["Ce1", "Ce2"] },
    { kakugo: "G3", triggers: ["G1", "G2"] },
    { kakugo: "Li3", triggers: ["Li1", "Li2"] },
    { kakugo: "An4", triggers: ["An1", "An3"] },
    { kakugo: "Me3", triggers: ["Me1", "Me2"] },
  ],
  humanities: [
    { kakugo: "M3", triggers: ["M1", "M2"] },
    { kakugo: "Me3", triggers: ["Me1", "Me2"] },
    { kakugo: "L3", triggers: ["Lh1", "Lh2"] },
    { kakugo: "F3", triggers: ["F1", "F4"] },
    { kakugo: "Lg3", triggers: ["Lg1", "Lg2"] },
    { kakugo: "Ca3", triggers: ["Ca1", "Ca5"] },
    { kakugo: "Ab3", triggers: ["Ab1", "Ab5"] },
    { kakugo: "T3", triggers: ["T1", "T2"] },
    { kakugo: "Ce3", triggers: ["Ce1", "Ce2"] },
    { kakugo: "G3", triggers: ["G1", "G2"] },
  ],
  sciences: [
    { kakugo: "M3", triggers: ["M1", "M2"] },
    { kakugo: "Me3", triggers: ["Me1", "Me2"] },
    { kakugo: "L3", triggers: ["L1", "L4"] },
    { kakugo: "F3", triggers: ["F1", "F4"] },
    { kakugo: "C3", triggers: ["C1", "C5"] },
    { kakugo: "Mk3", triggers: ["Mk1", "Mk5"] },
    { kakugo: "Ca3", triggers: ["Ca1", "Ca2"] },
    { kakugo: "Ab3", triggers: ["Ab1", "Ab2"] },
    { kakugo: "T3", triggers: ["T1", "T2"] },
    { kakugo: "Ce3", triggers: ["Ce1", "Ce2"] },
    { kakugo: "G3", triggers: ["G1", "G2"] },
    { kakugo: "Li3", triggers: ["Li1", "Li4"] },
    { kakugo: "An4", triggers: ["An1", "An3"] },
  ],
};

// バージョン指定で出題順の質問配列を取得
export function getQuestionsForVersion(version: Version): Question[] {
  const order = VERSION_ORDERS[version];
  const map = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
  return order.map((id) => {
    const q = map.get(id);
    if (!q) throw new Error(`Question not found: ${id}`);
    return q;
  });
}

// バージョン指定で SET_SIZES を取得
export function getSetSizes(version: Version): readonly number[] {
  return VERSION_SET_SIZES[version];
}
