// Page 7: 特徴文パーツ + 基準パーツの動的選出

// 軸インデックス
const MATH = 0, MEMO = 1, LAB = 2, FIELD = 3, CODE = 4, MAKE = 5, LANG = 6, CARE = 7;
const BIZ = 8, ART = 9, ABS = 10, TEAM = 11, CERT = 12, GRAD = 13, LIFE = 14, ANIMAL = 15;
// 2026-04-25 追加
const NARRATIVE = 16, JUSTICE = 17, BODY = 18;

type Trait = {
  condition: (s: number[]) => boolean;
  text: string;
};

type Criterion = {
  condition: (s: number[]) => boolean;
  title: string;
  description: string;
};

const traits: Trait[] = [
  { condition: (s) => s[ABS] >= 0.7,
    text: "あなたは、目に見えないものの仕組みや原理をじっくり考えることが好きなタイプです" },
  { condition: (s) => s[LAB] >= 0.7,
    text: "手を動かして実験やデータ収集をすることで理解を深めるタイプです" },
  { condition: (s) => s[FIELD] >= 0.7,
    text: "机の上より現場に出て、自分の目で確かめたい行動派です" },
  { condition: (s) => s[CARE] >= 0.7,
    text: "人と関わり、誰かの役に立つことにやりがいを感じるタイプです" },
  { condition: (s) => s[BIZ] >= 0.6 && s[TEAM] >= 0.5,
    text: "人と協力しながら、社会やビジネスの仕組みを動かすことに興味があるタイプです" },
  { condition: (s) => s[CODE] >= 0.7 || s[MAKE] >= 0.7,
    text: "アイデアを自分の手で形にすることにモチベーションを感じるタイプです" },
  { condition: (s) => s[LANG] >= 0.7,
    text: "言葉や文章を通じて、異なる文化や考え方に触れることが好きなタイプです" },
  { condition: (s) => s[MATH] >= 0.7 && s[ABS] >= 0.5,
    text: "数式や論理を使って物事を整理・証明するのが得意なタイプです" },
  { condition: (s) => s[CERT] >= 0.7,
    text: "明確な資格やゴールに向かって努力を積み重ねることができるタイプです" },
  { condition: (s) => s[TEAM] >= 0.6 && s[CARE] < 0.5,
    text: "チームで動くのが好きだが、ケアよりも成果や議論を重視するタイプです" },
  { condition: (s) => s[GRAD] >= 0.7,
    text: "4年では足りない、もっと深く知りたいという探究心が強いタイプです" },
  { condition: (s) => s[ART] >= 0.6,
    text: "美しさや表現へのこだわりがあり、感性を大切にするタイプです" },
  // 2026-04-25 追加（新軸）
  { condition: (s) => s[NARRATIVE] >= 0.6,
    text: "言葉や物語の表現に深い感受性を持ち、人の心や思想を読み解くタイプです" },
  { condition: (s) => s[JUSTICE] >= 0.6,
    text: "社会のルールや正義に強い関心を持ち、不公平を正したいと考えるタイプです" },
  { condition: (s) => s[BODY] >= 0.6,
    text: "身体の仕組みや運動パフォーマンスを科学的に追求したいタイプです" },
];

const criteria: Criterion[] = [
  { condition: (s) => s[GRAD] >= 0.7,
    title: "大学院進学率",
    description: "その学科から大学院に進む人の割合を確認しよう。研究を深めたいなら、院進が当たり前の環境の方が仲間も情報も多い" },
  { condition: (s) => s[LAB] >= 0.7,
    title: "研究室の配属時期",
    description: "3年前期から配属される大学もあれば4年からの大学もある。早く研究を始めたいなら配属時期を比べてみよう" },
  { condition: (s) => s[CERT] >= 0.7,
    title: "資格の合格率",
    description: "同じ学科でも大学によって国家試験の合格率は大きく違う。目指す資格があるなら、合格実績を確認しよう" },
  { condition: (s) => s[FIELD] >= 0.7,
    title: "フィールドワークや実習の機会",
    description: "現場に出る授業がどれくらいあるかは大学ごとに差がある。立地や提携先も含めて調べてみよう" },
  { condition: (s) => s[CODE] >= 0.7 || s[MAKE] >= 0.7,
    title: "設備・工房・計算機環境",
    description: "自分の手で作るには道具が要る。実験設備、工作室、計算サーバーなど、使える環境を比較しよう" },
  { condition: (s) => s[BIZ] >= 0.6,
    title: "インターンシップ制度",
    description: "企業との連携やインターンの機会が多い大学は、ビジネスの現場を早く体験できる" },
  { condition: (s) => s[CARE] >= 0.7 && s[TEAM] >= 0.5,
    title: "少人数制・教員との距離",
    description: "教員一人あたりの学生数が少ないほど、丁寧な指導やフィードバックが受けやすい" },
  { condition: (s) => s[LANG] >= 0.7,
    title: "留学制度・海外提携校",
    description: "留学先の選択肢、費用補助、単位互換の仕組みは大学によって大きく異なる" },
  { condition: (s) => s[TEAM] >= 0.6,
    title: "キャンパスの雰囲気・学生の活気",
    description: "グループワークや課外活動が盛んな大学は、オープンキャンパスで雰囲気を感じてみよう" },
  { condition: (s) => s[ABS] >= 0.7 && s[MATH] >= 0.5,
    title: "教員の専門分野",
    description: "理論系は教授の研究テーマが学びに直結する。自分が興味ある分野の教員がいるか調べてみよう" },
  { condition: (s) => s[LIFE] >= 0.7,
    title: "附属病院・臨床実習先",
    description: "医療系は実習先の規模や症例数が学びの質を左右する。附属病院の有無と規模を確認しよう" },
  { condition: (s) => s[ANIMAL] >= 0.7,
    title: "附属農場・動物病院",
    description: "動物と関わる学科は、大学が持つ農場や動物病院の規模で実習の質が変わる" },
  { condition: (s) => s[ART] >= 0.6 && s[MAKE] >= 0.5,
    title: "作品制作・講評の機会",
    description: "設計やデザインが中心の学科では、課題の量と講評の質が実力に直結する" },
  { condition: (s) => s[MEMO] >= 0.7 && s[CERT] < 0.5,
    title: "カリキュラムの自由度",
    description: "必修が多い大学と選択が多い大学がある。幅広く学びたいなら自由度の高い方を選ぼう" },
  { condition: (s) => s[GRAD] < 0.4 && s[CERT] < 0.4,
    title: "就職実績・キャリア支援",
    description: "資格や院進より就職を考えるなら、学科別の就職先一覧やキャリアセンターの充実度を見てみよう" },
  { condition: (s) => s[BIZ] >= 0.5 && s[TEAM] >= 0.5,
    title: "卒業生ネットワーク（OB・OG）",
    description: "就職やビジネスでは先輩とのつながりが力になる。卒業生の活躍分野や校友会の活発さも判断材料になる" },
  { condition: (s) => s[FIELD] >= 0.5,
    title: "寮・住環境サポート",
    description: "地方の大学を視野に入れるなら、学生寮の有無や家賃補助制度を確認しよう。住環境は学生生活の満足度に直結する" },
  // 2026-04-25 追加（新軸）
  { condition: (s) => s[NARRATIVE] >= 0.6,
    title: "ゼミ・少人数演習の充実度",
    description: "文学・哲学系では、テキスト精読や対話型のゼミの質が学びを左右する。教員と学生の対話量を比べてみよう" },
  { condition: (s) => s[JUSTICE] >= 0.6,
    title: "模擬裁判・法律相談所などの実践機会",
    description: "法律や政治を学ぶ学科では、実践的な学びの場（模擬裁判・地方議会連携など）の有無で「論理を使う筋肉」の鍛え方が変わる" },
  { condition: (s) => s[BODY] >= 0.6,
    title: "スポーツ施設・トレーニング設備",
    description: "身体科学を学ぶ学科は、測定機器・トレーニング室・提携アスリート環境の充実度が実習の質に直結する" },
];

export type Page7Content = {
  traits: string[];
  criteria: { title: string; description: string }[];
};

export function getPage7Content(axisScores: number[]): Page7Content {
  const matchedTraits = traits
    .filter((t) => t.condition(axisScores))
    .slice(0, 3)
    .map((t) => t.text);

  const matchedCriteria = criteria
    .filter((c) => c.condition(axisScores))
    .slice(0, 4)
    .map((c) => ({ title: c.title, description: c.description }));

  return { traits: matchedTraits, criteria: matchedCriteria };
}
