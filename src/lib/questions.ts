// 質問プール（72問）+ 3バージョン対応（mixed / humanities / sciences）
//
// バージョン:
//   mixed      = 文理混合版（61問・既存）
//   humanities = 文系特化版（47問 = 共通25 + 文系のみ16 + 文系追加6）
//   sciences   = 理系特化版（50問 = 共通25 + 理系のみ20 + 理系追加5）
//
// 軸インデックス:
//   MATH=0, MEMO=1, LAB=2, FIELD=3, CODE=4, MAKE=5, LANG=6, CARE=7
//   BIZ=8, ART=9, ABS=10, TEAM=11, CERT=12, GRAD=13, LIFE=14, ANIMAL=15
//   NARRATIVE=16, JUSTICE=17, BODY=18

export type Version = "mixed" | "humanities" | "sciences";

export type Question = {
  id: string;
  text: string;
  axisIndex: number;
  reverse: boolean;
  versions: Version[];
};

// 全72問のプール（出題順は VERSION_ORDERS で別管理）
const ALL_QUESTIONS: Question[] = [
  // ===== 共通質問（25問・全バージョン） =====
  { id: "F1",   text: "教室にいるより、外に出て自分の目で見たり体験したりするほうが好きだ",
    axisIndex: 3,  reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ca1",  text: "友達が落ち込んでいるとき、自分から声をかけて話を聞く側になることが多い",
    axisIndex: 7,  reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Me1",  text: "興味のあるテーマについて、用語や定義などの細かい知識まで覚えたくなる",
    axisIndex: 1,  reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ce1",  text: "国家資格を取って、その道のプロとして働くことに憧れがある",
    axisIndex: 12, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "T1",   text: "グループで意見を出し合って進めるほうが、一人で黙々とやるより好きだ",
    axisIndex: 11, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ab1",  text: "「自分とは何か」「時間は本当に存在するのか」のような、答えが一つに決まらない問いを考えるのが好きだ",
    axisIndex: 10, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "G1",   text: "大学4年間では足りないくらい、一つのテーマを深く研究してみたい",
    axisIndex: 13, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Bo1",  text: "運動や筋肉の仕組みを科学的に分析して、身体のパフォーマンスを高めることに興味がある",
    axisIndex: 18, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "F2",   text: "街や自然の中を実際に歩いて、自分の目や耳で情報を集めるのが好きだ",
    axisIndex: 3,  reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Me2",  text: "気になったテーマを、図鑑や Wikipedia で関連知識まで読み込みたくなる",
    axisIndex: 1,  reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ca2",  text: "後輩や友達に勉強を教えるのが得意だし、やりがいを感じる",
    axisIndex: 7,  reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ab2",  text: "目に見えない法則や原理を理解できた瞬間に快感を覚える",
    axisIndex: 10, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "T2",   text: "チームの中で役割分担を決めて動くのが楽しい",
    axisIndex: 11, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Ce2",  text: "「この資格があれば一生食べていける」という安心感に魅力を感じる",
    axisIndex: 12, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "G2",   text: "最先端の研究をしている人の話を聞くと、自分もやってみたいと思う",
    axisIndex: 13, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "F3",   text: "真夏の炎天下や雨の日に外で長時間活動するのは、正直つらいと思う",
    axisIndex: 3,  reverse: true,  versions: ["mixed", "humanities", "sciences"] },
  { id: "Ca3",  text: "泣いたり怒ったりしている人の前にいると、自分もつらくなって対応に困ることがある",
    axisIndex: 7,  reverse: true,  versions: ["mixed", "humanities", "sciences"] },
  { id: "Me3",  text: "テスト前に大量の暗記が必要だと、気が重くなる",
    axisIndex: 1,  reverse: true,  versions: ["mixed", "humanities", "sciences"] },
  { id: "Ab3",  text: "考えても考えても答えが出ない問題は、途中で投げ出したくなるほうだ",
    axisIndex: 10, reverse: true,  versions: ["mixed", "humanities", "sciences"] },
  { id: "T3",   text: "意見が合わない人と一緒に作業すると、ストレスを感じるほうだ",
    axisIndex: 11, reverse: true,  versions: ["mixed", "humanities", "sciences"] },
  { id: "Ce3",  text: "同じ教科書を何周もするような勉強生活を何年も続けるのはつらいと思う",
    axisIndex: 12, reverse: true,  versions: ["mixed", "humanities", "sciences"] },
  { id: "G3",   text: "大学卒業後も2〜5年間、学生として研究を続ける生活に抵抗がない",
    axisIndex: 13, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Bo2",  text: "スポーツの戦術や試合の分析・データを見るのが好きだ",
    axisIndex: 18, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "Bo3",  text: "食事・睡眠・トレーニングなど、身体を整える方法に関心がある",
    axisIndex: 18, reverse: false, versions: ["mixed", "humanities", "sciences"] },
  { id: "F4",   text: "街に出て人々にインタビューやアンケートを行い、社会の実態を自分の足で調べたい",
    axisIndex: 3,  reverse: false, versions: ["mixed", "humanities", "sciences"] },

  // ===== 文系のみ（16問・mixed + humanities） =====
  { id: "B1",   text: "企業がどうやって利益を出しているか、仕組みに興味がある",
    axisIndex: 8,  reverse: false, versions: ["mixed", "humanities"] },
  { id: "Lg1",  text: "外国語を学んで、海外の人とコミュニケーションを取りたい",
    axisIndex: 6,  reverse: false, versions: ["mixed", "humanities"] },
  { id: "A1",   text: "デザインや色の組み合わせなど、見た目の美しさにこだわりがある",
    axisIndex: 9,  reverse: false, versions: ["mixed", "humanities"] },
  { id: "N1",   text: "小説や詩の表現を深く味わい、作者がなぜその言葉を選んだのかを考えるのが好きだ",
    axisIndex: 16, reverse: false, versions: ["mixed", "humanities"] },
  { id: "J1",   text: "法律の条文を正確に読み解き、論理で結論を導きたいと思う",
    axisIndex: 17, reverse: false, versions: ["mixed", "humanities"] },
  { id: "B2",   text: "文化祭やイベントで「売上」「集客」を考えるのが楽しい",
    axisIndex: 8,  reverse: false, versions: ["mixed", "humanities"] },
  { id: "Lg2",  text: "古い文章や難しい本をじっくり読み解く作業に達成感を覚える",
    axisIndex: 6,  reverse: false, versions: ["mixed", "humanities"] },
  { id: "A2",   text: "絵を描いたり、写真を撮ったり、自分なりの表現をするのが好きだ",
    axisIndex: 9,  reverse: false, versions: ["mixed", "humanities"] },
  { id: "N2",   text: "ものごとの前提を疑い、「そもそもそれは正しいのか」と論理で問い直すのが好きだ",
    axisIndex: 16, reverse: false, versions: ["mixed", "humanities"] },
  { id: "J2",   text: "選挙の仕組みや、政治家・官僚がどう意思決定しているかに興味がある",
    axisIndex: 17, reverse: false, versions: ["mixed", "humanities"] },
  { id: "Lg3",  text: "毎日コツコツ単語を覚えたり文法問題を解いたりする勉強は退屈に感じる",
    axisIndex: 6,  reverse: true,  versions: ["mixed", "humanities"] },
  { id: "B3",   text: "文化祭の出店やフリマで、売上目標を決めて工夫するのは楽しそうだ",
    axisIndex: 8,  reverse: false, versions: ["mixed", "humanities"] },
  { id: "A3",   text: "「正解がない」課題に対して、自分の感性だけで勝負するのは怖くない",
    axisIndex: 9,  reverse: false, versions: ["mixed", "humanities"] },
  { id: "Bz4",  text: "人やチームを率いて、新しいビジネスやプロジェクトを立ち上げたい",
    axisIndex: 8,  reverse: false, versions: ["mixed", "humanities"] },
  { id: "N3",   text: "言葉や物語が人の心を動かす力に魅力を感じる",
    axisIndex: 16, reverse: false, versions: ["mixed", "humanities"] },
  { id: "J3",   text: "不公平な状況を見ると、「どう正すべきか」を考えたくなる",
    axisIndex: 17, reverse: false, versions: ["mixed", "humanities"] },

  // ===== 理系のみ（20問・mixed + sciences） =====
  { id: "L1",   text: "理科の授業で、ビーカーや試験管を使って実験する時間が好きだ",
    axisIndex: 2,  reverse: false, versions: ["mixed", "sciences"] },
  { id: "C1",   text: "コードを書いてアプリやゲームを動かすことに興味がある",
    axisIndex: 4,  reverse: false, versions: ["mixed", "sciences"] },
  { id: "Mk1",  text: "模型や工作など、手を動かして形にする作業が好きだ",
    axisIndex: 5,  reverse: false, versions: ["mixed", "sciences"] },
  { id: "M1",   text: "数式を使って法則を導き出す作業にワクワクする",
    axisIndex: 0,  reverse: false, versions: ["mixed", "sciences"] },
  { id: "An1",  text: "動物の生態や行動を観察するのが好きだ",
    axisIndex: 15, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Li1",  text: "将来、生き物の生死に直接関わる現場で働きたいと思う",
    axisIndex: 14, reverse: false, versions: ["mixed", "sciences"] },
  { id: "L2",   text: "実験で試薬を混ぜたり温度を変えたりして、結果がどう変わるか観察するのが楽しい",
    axisIndex: 2,  reverse: false, versions: ["mixed", "sciences"] },
  { id: "C2",   text: "パソコンで作業を自動化したり、データを分析したりするのが楽しそうだ",
    axisIndex: 4,  reverse: false, versions: ["mixed", "sciences"] },
  { id: "Mk2",  text: "「こういう建物や製品があったらいいな」と頭の中で設計図を描くことがある",
    axisIndex: 5,  reverse: false, versions: ["mixed", "sciences"] },
  { id: "M2",   text: "日常の現象を「数字で説明できないか」と考えることがある",
    axisIndex: 0,  reverse: false, versions: ["mixed", "sciences"] },
  { id: "An2",  text: "保護犬・保護猫の活動や、動物園・水族館の裏側に興味がある",
    axisIndex: 15, reverse: false, versions: ["mixed", "sciences"] },
  { id: "Li2",  text: "手術や解剖の映像を見ても、怖さより「どんな処置をしているのか」に注目するほうだ",
    axisIndex: 14, reverse: false, versions: ["mixed", "sciences"] },
  { id: "M3",   text: "計算問題がずっと続くと、途中で集中が切れてしまうほうだ",
    axisIndex: 0,  reverse: true,  versions: ["mixed", "sciences"] },
  { id: "L3",   text: "実験が失敗しても原因を探してやり直すことに抵抗がない",
    axisIndex: 2,  reverse: false, versions: ["mixed", "sciences"] },
  { id: "C3",   text: "パソコンで何かを作っていてうまくいかないと、すぐに諦めたくなるほうだ",
    axisIndex: 4,  reverse: true,  versions: ["mixed", "sciences"] },
  { id: "Mk3",  text: "作品を何度もやり直すのは面倒で、早く完成させたいほうだ",
    axisIndex: 5,  reverse: true,  versions: ["mixed", "sciences"] },
  { id: "Li3",  text: "生き物が苦しんでいる様子を目にすると、自分もつらくなって見ていられなくなる",
    axisIndex: 14, reverse: true,  versions: ["mixed", "sciences"] },
  { id: "An3",  text: "動物の排泄物の処理や、汚れた環境での長時間の作業には抵抗がある",
    axisIndex: 15, reverse: true,  versions: ["mixed", "sciences"] },
  { id: "An4",  text: "動物の解剖実習や、治療中の動物が亡くなる場面があっても、仕事として続けられると思う",
    axisIndex: 15, reverse: false, versions: ["mixed", "sciences"] },
  { id: "L4",   text: "化学反応を自分で起こして、新しい素材や物質を作り出すことに興味がある",
    axisIndex: 2,  reverse: false, versions: ["mixed", "sciences"] },

  // ===== 文系版のみの追加質問（6問・humanities のみ） =====
  { id: "Ca4",  text: "学校や福祉の現場で、子どもや家庭を支える仕事に魅力を感じる",
    axisIndex: 7,  reverse: false, versions: ["humanities"] },
  { id: "Ca5",  text: "人の話をじっくり聴いて、心の悩みに寄り添う仕事をしてみたい",
    axisIndex: 7,  reverse: false, versions: ["humanities"] },
  { id: "Lg4",  text: "原文で外国の文学や思想を読み、翻訳では失われるニュアンスを味わいたい",
    axisIndex: 6,  reverse: false, versions: ["humanities"] },
  { id: "Bz5",  text: "経営者や起業家の話を読んで、自分も意思決定する側に立ちたいと思う",
    axisIndex: 8,  reverse: false, versions: ["humanities"] },
  { id: "N4",   text: "歴史的な文章や思想を読み解いて、長く読み継がれる理由を考えるのが好きだ",
    axisIndex: 16, reverse: false, versions: ["humanities"] },
  { id: "Ab4",  text: "「常識」や「当たり前」を一度疑って、自分の頭で考え直す習慣がある",
    axisIndex: 10, reverse: false, versions: ["humanities"] },

  // ===== 理系版のみの追加質問（5問・sciences のみ） =====
  { id: "M4",   text: "集合論・群論・位相空間など、抽象的な数学の世界に触れてみたい",
    axisIndex: 0,  reverse: false, versions: ["sciences"] },
  { id: "C4",   text: "プログラムの計算量を減らしたり、効率を追求することに快感を覚える",
    axisIndex: 4,  reverse: false, versions: ["sciences"] },
  { id: "Mk4",  text: "機械や装置を分解して、内部の仕組みを観察するのが好きだ",
    axisIndex: 5,  reverse: false, versions: ["sciences"] },
  { id: "Mk5",  text: "建物・橋・乗り物などの構造が、どう力を支えているかに興味がある",
    axisIndex: 5,  reverse: false, versions: ["sciences"] },
  { id: "Ab4r", text: "抽象的な議論より、目の前の具体的な問題を解くほうが好きだ",
    axisIndex: 10, reverse: true,  versions: ["sciences"] },
];

// バージョンごとの出題順
const VERSION_ORDERS: Record<Version, readonly string[]> = {
  // 混合版 61問（既存順序）
  mixed: [
    // セット1
    "L1", "Ca1", "C1", "F1", "Mk1", "B1", "Lg1", "M1", "A1", "An1",
    // セット2
    "Ab1", "T1", "Ce1", "G1", "Li1", "Me1", "L2", "F2", "C2", "Mk2",
    // セット3
    "Ca2", "B2", "Lg2", "M2", "A2", "An2", "Ab2", "T2", "Ce2", "G2",
    // セット4
    "Me2", "Li2", "M3", "L3", "F3", "C3", "Mk3", "Lg3", "Ca3", "B3",
    // セット5（9問）
    "A3", "Ab3", "T3", "Ce3", "G3", "Li3", "An3", "An4", "Me3",
    // セット6（12問）
    "N1", "J1", "Bo1", "N2", "J2", "Bo2", "F4", "Bz4", "L4", "N3", "J3", "Bo3",
  ],
  // 文系版 47問
  humanities: [
    // セット1（10）
    "F1", "Ca1", "B1", "Lg1", "A1", "N1", "J1", "Me1", "Ce1", "T1",
    // セット2（10）
    "Ab1", "Bo1", "G1", "Bz4", "Ca4", "Ca5", "F2", "Lg2", "N2", "J2",
    // セット3（10）
    "Me2", "B2", "A2", "Ab2", "T2", "Ce2", "G2", "Lg4", "N3", "J3",
    // セット4（10）
    "F3", "Lg3", "Ca3", "Me3", "Ab3", "T3", "Ce3", "B3", "A3", "Bo2",
    // セット5（7）
    "Ca2", "F4", "Ab4", "G3", "Bz5", "N4", "Bo3",
  ],
  // 理系版 50問
  sciences: [
    // セット1（10）
    "L1", "Ca1", "C1", "F1", "Mk1", "M1", "Me1", "Ce1", "T1", "An1",
    // セット2（10）
    "Ab1", "G1", "Li1", "Bo1", "L2", "F2", "C2", "Mk2", "Me2", "An2",
    // セット3（10）
    "Ca2", "M2", "Ab2", "T2", "Ce2", "G2", "M4", "C4", "Mk4", "Mk5",
    // セット4（10）
    "Li2", "F3", "M3", "C3", "Mk3", "Ca3", "L3", "L4", "Bo2", "Ab4r",
    // セット5（10）
    "F4", "Bo3", "Ab3", "T3", "Ce3", "G3", "Li3", "An3", "An4", "Me3",
  ],
};

// バージョンごとのセット区切り
export const VERSION_SET_SIZES: Record<Version, readonly number[]> = {
  mixed:      [10, 10, 10, 10, 9, 12],
  humanities: [10, 10, 10, 10, 7],
  sciences:   [10, 10, 10, 10, 10],
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
