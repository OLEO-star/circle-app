// 36学科 × 22軸 スコアマトリクス（2026-06-18 新規4学部追加・9×4化）
// 軸順（0-15: 既存）: MATH, MEMO, LAB, FIELD, CODE, MAKE, LANG, CARE, BIZ, ART, ABS, TEAM, CERT, GRAD, LIFE, ANIMAL
// 軸順（16-18: 2026-04-25 追加）: NARRATIVE, JUSTICE, BODY
// 軸順（19-21: 2026-06-12 追加）: PURE（純粋⇄応用志向）, BIO（生体・生命現象）, PROC（量産・プロセス設計）
//   化学系4学科・情報2学科のベクトル重複解消が目的。値の根拠と監査記録は
//   analysis/2026-06-12-question-addition-design.md §6.3 参照。
//   sciences/mixed のみ計測（humanities では scoring.ts の MEASURED_AXES でゼロ化）

import type { Version } from "./questions";

export type Department = {
  id: string;
  name: string;
  categoryIndex: number; // 0-8（mixed 版のリング位置 = 9カテゴリ。2026-06-18 9×4化）
  scores: number[]; // 22軸スコア
  gradExempt?: boolean; // 医学科・獣医学科・歯学科: GRAD軸適用外
  versions?: Version[]; // 出現バージョン（省略時は全バージョン）
  humSlot?: number; // 0-7（humanities 版のリング位置）
  sciSlot?: number; // 0-7（sciences 版のリング位置）
};

export const AXIS_NAMES = [
  "MATH", "MEMO", "LAB", "FIELD", "CODE", "MAKE", "LANG", "CARE",
  "BIZ", "ART", "ABS", "TEAM", "CERT", "GRAD", "LIFE", "ANIMAL",
  "NARRATIVE", "JUSTICE", "BODY", "PURE", "BIO", "PROC",
] as const;

export const AXIS_COUNT = 22;

// ===== mixed 版（9カテゴリ×4学部=36学科。2026-06-18 9×4化・revcolor確定） =====
// 並び＝12時(seam=紫→青)起点に時計回り。配色＝逆順パレット（grouping_9x4_revcolor.json）。
// 確定デザイン: analysis/ring-mockups/2026-06-17-32faculty/new9x4r_A.png
export const CATEGORY_NAMES = [
  "数理・情報",
  "物理・化学",
  "機械・材料",
  "建設・環境",
  "生命・医療",
  "健康・こころ",
  "教育・人文",
  "法・政治・社会",
  "経済・経営",
] as const;

export const CATEGORY_COLORS = [
  "#4A7BF7", // 青     - 数理・情報
  "#42C5D9", // 水     - 物理・化学
  "#4CAF50", // 緑     - 機械・材料
  "#A8D820", // 黄緑   - 建設・環境
  "#F5EE42", // 黄     - 生命・医療（2026-06-19 橙味を抜き純黄寄りへ #F5D442→）
  "#F59B42", // 橙     - 健康・こころ
  "#EF5350", // 赤     - 教育・人文
  "#E05ADD", // ピンク - 法・政治・社会（2026-06-19 赤と分離するため紫寄りへ #E05A9F→）
  "#7B5CF5", // 紫     - 経済・経営
] as const;

// ===== humanities 版（文系・暖色） =====
// 並び: 経済 → 経営・商 → 法・政治 → 社会・国際 → 文学・外国語 → 哲学 → 心理 → 教育・スポーツ
export const HUMANITIES_CATEGORY_NAMES = [
  "経済",
  "経営・商",
  "法・政治",
  "社会・国際",
  "文学・外国語",
  "哲学",
  "心理",
  "教育・スポーツ",
] as const;

export const HUMANITIES_CATEGORY_COLORS = [
  "#B8002F", // 深紅 - 経済
  "#FF7A1A", // オレンジ - 経営・商
  "#FFD400", // イエロー - 法・政治
  "#C5E33D", // 黄緑 - 社会・国際
  "#F8E89C", // ペールイエロー - 文学・外国語
  "#F0E6CC", // アイボリー - 哲学
  "#FF9685", // コーラルピンク - 心理
  "#E03767", // ローズレッド - 教育・スポーツ（深紅へつなぐ）
] as const;

// ===== sciences 版（理系・寒色） =====
// 並び: 数理・情報 → 工学 → 物理・地球 → 化学 → 生物 → 生命・医療 → 農・獣医 → 身体運動
export const SCIENCES_CATEGORY_NAMES = [
  "数理・情報",
  "工学",
  "物理・地球",
  "化学",
  "生物",
  "生命・医療",
  "農・獣医",
  "身体運動",
] as const;

export const SCIENCES_CATEGORY_COLORS = [
  "#1E40AF", // コバルトブルー - 数理・情報
  "#00C9D7", // ブライトアクア - 工学
  "#1FCB9E", // ターコイズ - 物理・地球
  "#2EAF6A", // エメラルドグリーン - 化学
  "#A8D820", // チャートリュース - 生物
  "#B2A0E5", // ラベンダー - 生命・医療
  "#6F3EBF", // バイオレット - 農・獣医
  "#0B1D5C", // ディープネイビー - 身体運動（コバルトへつなぐ）
] as const;

// バージョン → カテゴリ名/色 のルックアップ
export const VERSION_CATEGORY_NAMES: Record<Version, readonly string[]> = {
  mixed: CATEGORY_NAMES,
  humanities: HUMANITIES_CATEGORY_NAMES,
  sciences: SCIENCES_CATEGORY_NAMES,
};

export const VERSION_CATEGORY_COLORS: Record<Version, readonly string[]> = {
  mixed: CATEGORY_COLORS,
  humanities: HUMANITIES_CATEGORY_COLORS,
  sciences: SCIENCES_CATEGORY_COLORS,
};

const HUM: Version[] = ["mixed", "humanities"];
const SCI: Version[] = ["mixed", "sciences"];
const BOTH: Version[] = ["mixed", "humanities", "sciences"];

// 16-18番目 [NARRATIVE, JUSTICE, BODY] は 2026-04-25 追加。
// 末尾3要素 [PURE, BIO, PROC] は 2026-06-12 追加（多視点監査済み・実データ未検証）
// gradExempt（GRAD軸を距離・ゲートから除外）: 医学科・獣医学科・歯学科（いずれも6年制・国家資格直行）
// categoryIndex（mixed 9カテゴリ）の所属は 9×4 確定編成（grouping_9x4_revcolor.json）：
//   0 数理・情報 {math, info-sci, data-sci, info-eng}
//   1 物理・化学 {physics, chemistry, applied-chem, life-chem}
//   2 機械・材料 {mechanical, electrical, chem-eng, materials-eng}
//   3 建設・環境 {architecture, civil-eng, earth-sci, agriculture}
//   4 生命・医療 {biology, medicine, dentistry, veterinary}
//   5 健康・こころ {pharmacy, nursing, psychology, sports-sci}
//   6 教育・人文 {education, literature, philosophy, foreign-lang}
//   7 法・政治・社会 {law, politics, sociology, intl-relations}
//   8 経済・経営 {economics, business, commerce, mgmt-eng}
// humSlot/sciSlot（humanities/sciences 版の 8 スロット）は不変更（今回は mixed のみ 9化）。
export const departments: Department[] = [
  // cat0 数理・情報（理系）
  { id: "math", name: "数学科", categoryIndex: 0, versions: SCI, sciSlot: 0,
    scores: [1.0, 0.3, 0.1, 0.0, 0.3, 0.0, 0.2, 0.0, 0.0, 0.1, 1.0, 0.1, 0.0, 0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.95, 0.05, 0.05] },
  { id: "info-sci", name: "情報科学科", categoryIndex: 0, versions: SCI, sciSlot: 0,
    scores: [0.7, 0.3, 0.2, 0.0, 0.9, 0.3, 0.2, 0.1, 0.2, 0.2, 0.7, 0.4, 0.1, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.65, 0.1, 0.15] },
  { id: "data-sci", name: "データサイエンス学科", categoryIndex: 0, versions: SCI, sciSlot: 0,
    scores: [0.9, 0.2, 0.1, 0.2, 0.8, 0.1, 0.2, 0.1, 0.4, 0.1, 0.6, 0.4, 0.1, 0.4, 0.0, 0.0, 0.0, 0.2, 0.0, 0.45, 0.15, 0.2] },

  // cat8 経済・経営（文系：経済/経営/商）
  { id: "economics", name: "経済学科", categoryIndex: 8, versions: HUM, humSlot: 0,
    scores: [0.8, 0.4, 0.0, 0.0, 0.3, 0.0, 0.3, 0.1, 0.5, 0.0, 0.7, 0.2, 0.0, 0.3, 0.0, 0.0, 0.0, 0.3, 0.0, 0.55, 0.05, 0.1] },
  { id: "business", name: "経営学科", categoryIndex: 8, versions: HUM, humSlot: 1,
    scores: [0.4, 0.4, 0.0, 0.1, 0.2, 0.0, 0.3, 0.3, 0.9, 0.1, 0.3, 0.7, 0.2, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.05, 0.25] },
  { id: "commerce", name: "商学科", categoryIndex: 8, versions: HUM, humSlot: 1,
    scores: [0.5, 0.5, 0.0, 0.0, 0.2, 0.0, 0.3, 0.2, 0.9, 0.0, 0.3, 0.4, 0.4, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.05, 0.15] },

  // cat7 法・政治・社会（文系）
  { id: "law", name: "法学科", categoryIndex: 7, versions: HUM, humSlot: 2,
    scores: [0.1, 0.9, 0.0, 0.0, 0.0, 0.0, 0.4, 0.3, 0.3, 0.0, 0.6, 0.2, 0.7, 0.3, 0.0, 0.0, 0.2, 1.0, 0.0, 0.45, 0.0, 0.05] },
  { id: "politics", name: "政治学科", categoryIndex: 7, versions: HUM, humSlot: 2,
    scores: [0.4, 0.6, 0.0, 0.2, 0.2, 0.0, 0.4, 0.3, 0.3, 0.0, 0.5, 0.3, 0.1, 0.3, 0.0, 0.0, 0.1, 0.8, 0.0, 0.4, 0.05, 0.05] },
  { id: "sociology", name: "社会学科", categoryIndex: 7, versions: HUM, humSlot: 3,
    scores: [0.4, 0.3, 0.0, 0.7, 0.2, 0.0, 0.3, 0.4, 0.1, 0.1, 0.5, 0.4, 0.0, 0.3, 0.0, 0.0, 0.3, 0.4, 0.0, 0.5, 0.05, 0.05] },
  { id: "intl-relations", name: "国際関係学科", categoryIndex: 7, versions: HUM, humSlot: 3,
    scores: [0.3, 0.4, 0.0, 0.4, 0.1, 0.0, 0.8, 0.3, 0.3, 0.1, 0.4, 0.5, 0.1, 0.3, 0.0, 0.0, 0.4, 0.3, 0.0, 0.35, 0.05, 0.05] },

  // cat6 教育・人文（文系：文学/外国語/哲学）
  { id: "literature", name: "文学科", categoryIndex: 6, versions: HUM, humSlot: 4,
    scores: [0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.9, 0.1, 0.0, 0.6, 0.5, 0.1, 0.1, 0.4, 0.0, 0.0, 1.0, 0.0, 0.0, 0.6, 0.05, 0.0] },
  { id: "foreign-lang", name: "外国語学科", categoryIndex: 6, versions: HUM, humSlot: 4,
    scores: [0.0, 0.4, 0.0, 0.3, 0.0, 0.0, 1.0, 0.3, 0.2, 0.3, 0.3, 0.3, 0.2, 0.2, 0.0, 0.0, 0.4, 0.0, 0.0, 0.4, 0.05, 0.05] },
  { id: "philosophy", name: "哲学科", categoryIndex: 6, versions: HUM, humSlot: 5,
    scores: [0.2, 0.4, 0.0, 0.0, 0.0, 0.0, 0.8, 0.1, 0.0, 0.4, 0.9, 0.1, 0.0, 0.5, 0.0, 0.0, 0.8, 0.2, 0.0, 0.75, 0.05, 0.0] },

  // 教育=cat6 教育・人文 / 心理・スポーツ科学=cat5 健康・こころ
  { id: "education", name: "教育学科", categoryIndex: 6, versions: HUM, humSlot: 7,
    scores: [0.2, 0.4, 0.0, 0.5, 0.1, 0.1, 0.2, 0.9, 0.1, 0.2, 0.3, 0.5, 0.7, 0.2, 0.1, 0.0, 0.2, 0.1, 0.3, 0.3, 0.1, 0.05] },
  { id: "psychology", name: "心理学科", categoryIndex: 5, versions: HUM, humSlot: 6,
    scores: [0.6, 0.4, 0.7, 0.2, 0.3, 0.0, 0.2, 0.7, 0.1, 0.1, 0.5, 0.3, 0.6, 0.5, 0.3, 0.0, 0.3, 0.1, 0.2, 0.55, 0.3, 0.05] },
  { id: "sports-sci", name: "スポーツ科学科", categoryIndex: 5, versions: BOTH, humSlot: 7, sciSlot: 7,
    scores: [0.3, 0.3, 0.4, 0.3, 0.1, 0.0, 0.2, 0.6, 0.3, 0.1, 0.2, 0.6, 0.4, 0.3, 0.1, 0.0, 0.0, 0.0, 1.0, 0.2, 0.4, 0.05] },

  // cat4 生命・医療（医/獣医） / cat5 健康・こころ（薬/看護） / cat3 建設・環境（農）
  { id: "medicine", name: "医学科", categoryIndex: 4, gradExempt: true, versions: SCI, sciSlot: 5,
    scores: [0.4, 1.0, 0.6, 0.5, 0.1, 0.0, 0.3, 0.8, 0.1, 0.0, 0.4, 0.5, 1.0, 0.0, 1.0, 0.1, 0.0, 0.1, 0.4, 0.25, 0.6, 0.05] },
  { id: "pharmacy", name: "薬学科", categoryIndex: 5, versions: SCI, sciSlot: 5,
    scores: [0.5, 0.8, 0.8, 0.3, 0.1, 0.0, 0.2, 0.4, 0.1, 0.0, 0.4, 0.3, 0.9, 0.3, 0.5, 0.0, 0.0, 0.0, 0.1, 0.4, 0.7, 0.3] },
  { id: "nursing", name: "看護学科", categoryIndex: 5, versions: SCI, sciSlot: 5,
    scores: [0.2, 0.7, 0.3, 0.8, 0.0, 0.0, 0.2, 1.0, 0.0, 0.0, 0.2, 0.7, 0.9, 0.1, 0.8, 0.0, 0.1, 0.0, 0.3, 0.15, 0.35, 0.05] },
  { id: "agriculture", name: "農学科", categoryIndex: 3, versions: SCI, sciSlot: 6,
    scores: [0.4, 0.3, 0.7, 0.8, 0.2, 0.1, 0.2, 0.2, 0.1, 0.0, 0.3, 0.3, 0.1, 0.7, 0.3, 0.6, 0.0, 0.0, 0.0, 0.4, 0.7, 0.35] },
  { id: "veterinary", name: "獣医学科", categoryIndex: 4, gradExempt: true, versions: SCI, sciSlot: 6,
    scores: [0.3, 0.9, 0.7, 0.5, 0.1, 0.0, 0.2, 0.7, 0.0, 0.0, 0.3, 0.4, 1.0, 0.0, 0.9, 1.0, 0.0, 0.0, 0.1, 0.25, 0.65, 0.05] },

  // cat2 機械・材料（機械/電気電子） / cat3 建設・環境（建築） / cat0 数理・情報（情報工）
  { id: "mechanical", name: "機械工学科", categoryIndex: 2, versions: SCI, sciSlot: 1,
    scores: [0.8, 0.3, 0.5, 0.1, 0.5, 0.9, 0.1, 0.1, 0.1, 0.1, 0.4, 0.4, 0.1, 0.5, 0.0, 0.0, 0.0, 0.0, 0.1, 0.3, 0.05, 0.5] },
  { id: "electrical", name: "電気電子工学科", categoryIndex: 2, versions: SCI, sciSlot: 1,
    scores: [0.8, 0.3, 0.8, 0.0, 0.6, 0.7, 0.1, 0.1, 0.1, 0.0, 0.5, 0.3, 0.1, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.4, 0.05, 0.45] },
  { id: "architecture", name: "建築学科", categoryIndex: 3, versions: SCI, sciSlot: 1,
    scores: [0.5, 0.3, 0.2, 0.2, 0.2, 0.9, 0.1, 0.3, 0.2, 0.9, 0.3, 0.4, 0.5, 0.4, 0.0, 0.0, 0.3, 0.0, 0.0, 0.25, 0.05, 0.25] },
  { id: "info-eng", name: "情報工学科", categoryIndex: 0, versions: SCI, sciSlot: 0,
    scores: [0.7, 0.2, 0.2, 0.0, 1.0, 0.4, 0.1, 0.1, 0.2, 0.2, 0.5, 0.5, 0.1, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.35, 0.1, 0.3] },

  // cat1 物理・化学（物理/化学/応用化学/生命化学） / cat3 建設・環境（地球科学） / cat4 生命・医療（生物） / cat2 機械・材料（化学工）
  { id: "physics", name: "物理学科", categoryIndex: 1, versions: SCI, sciSlot: 2,
    scores: [0.9, 0.3, 0.5, 0.0, 0.3, 0.1, 0.2, 0.0, 0.0, 0.0, 1.0, 0.1, 0.0, 0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.9, 0.1, 0.1] },
  { id: "biology", name: "生物学科", categoryIndex: 4, versions: SCI, sciSlot: 4,
    scores: [0.3, 0.4, 0.8, 0.7, 0.2, 0.0, 0.2, 0.1, 0.0, 0.0, 0.3, 0.2, 0.0, 0.6, 0.2, 0.5, 0.0, 0.0, 0.1, 0.6, 0.85, 0.1] },
  { id: "earth-sci", name: "地球科学科", categoryIndex: 3, versions: SCI, sciSlot: 2,
    scores: [0.5, 0.3, 0.4, 0.9, 0.2, 0.1, 0.2, 0.1, 0.0, 0.1, 0.4, 0.3, 0.0, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.65, 0.2, 0.1] },
  { id: "chemistry", name: "化学科", categoryIndex: 1, versions: SCI, sciSlot: 3,
    scores: [0.5, 0.4, 0.9, 0.0, 0.2, 0.1, 0.2, 0.0, 0.0, 0.0, 0.6, 0.2, 0.0, 0.7, 0.0, 0.0, 0.0, 0.0, 0.0, 0.85, 0.3, 0.2] },
  { id: "applied-chem", name: "応用化学科", categoryIndex: 1, versions: SCI, sciSlot: 3,
    scores: [0.5, 0.4, 0.9, 0.0, 0.2, 0.2, 0.2, 0.0, 0.1, 0.0, 0.4, 0.3, 0.1, 0.7, 0.0, 0.0, 0.0, 0.0, 0.0, 0.55, 0.3, 0.45] },
  { id: "chem-eng", name: "化学工学科", categoryIndex: 2, versions: SCI, sciSlot: 3,
    scores: [0.7, 0.3, 0.7, 0.1, 0.4, 0.4, 0.1, 0.1, 0.2, 0.0, 0.4, 0.4, 0.1, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.3, 0.75] },
  { id: "life-chem", name: "生命化学科", categoryIndex: 1, versions: SCI, sciSlot: 4,
    scores: [0.4, 0.4, 0.8, 0.0, 0.2, 0.0, 0.2, 0.0, 0.1, 0.0, 0.3, 0.2, 0.0, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 0.55, 0.9, 0.3] },

  // ===== 新規4学部（2026-06-18 追加・9×4化／栄養は不採用）=====
  // scores は「6大学帯シラバス実採取」の確定値（analysis/2026-06-18-new4-syllabus-axis-study.md）。
  //   類推値ではなく実データ。最大の修正＝材料工 PROC 0.65→0.4（単位操作/移動現象は化学工固有で材料工に無い）。
  // categoryIndex は 9×4 確定編成: 歯=cat4 生命・医療 / 材料工=cat2 機械・材料 /
  //   土木=cat3 建設・環境 / 経営工=cat8 経済・経営。
  //   sciSlot は sciences 版（8スロット）の暫定値のまま（sciences のカテゴリ再編は今回やらない）。
  { id: "dentistry", name: "歯学科", categoryIndex: 4, gradExempt: true, versions: SCI, sciSlot: 5,
    scores: [0.3, 0.9, 0.7, 0.3, 0.1, 0.6, 0.2, 0.8, 0.2, 0.2, 0.3, 0.5, 1.0, 0.0, 0.85, 0.05, 0.0, 0.05, 0.4, 0.2, 0.55, 0.15] },
  { id: "materials-eng", name: "材料工学科", categoryIndex: 2, versions: SCI, sciSlot: 1,
    scores: [0.7, 0.3, 0.85, 0.0, 0.35, 0.55, 0.1, 0.05, 0.15, 0.1, 0.6, 0.35, 0.1, 0.7, 0.0, 0.0, 0.0, 0.0, 0.05, 0.45, 0.15, 0.4] },
  { id: "civil-eng", name: "土木・都市環境工学科", categoryIndex: 3, versions: SCI, sciSlot: 1,
    scores: [0.6, 0.3, 0.5, 0.7, 0.3, 0.85, 0.1, 0.2, 0.2, 0.3, 0.4, 0.6, 0.55, 0.45, 0.05, 0.0, 0.1, 0.15, 0.2, 0.3, 0.1, 0.6] },
  { id: "mgmt-eng", name: "経営工学科", categoryIndex: 8, versions: SCI, sciSlot: 0,
    scores: [0.8, 0.3, 0.1, 0.15, 0.65, 0.25, 0.15, 0.2, 0.75, 0.1, 0.6, 0.7, 0.35, 0.35, 0.0, 0.0, 0.0, 0.05, 0.0, 0.35, 0.05, 0.6] },
];

// 理系学科の判定は【学科単位】で行う（2026-06-18 9×4化に伴い categoryIndex 集合では不可に）。
// mixed が 9カテゴリ化したことで categoryIndex の意味が変わり、旧 [0,5,6,7] は破綻する。
// uni-finder は理系学科のみ対応のため、結果ページの「大学を探す」導線でこの集合を使って
// 理系学科だけを ?dept= に渡す。
// 理系 = sciences 版に出現する学科（versions に "sciences" を含む = SCI / BOTH）。
//   ＝ 従来 sciences 版に出ていた学科 ＋ 新規4学部（歯/材料工/土木/経営工、いずれも versions:SCI）。
//   スポーツ科学（BOTH）も sciences 版に出るため理系扱い（uni-finder 側に存在）。
export const SCIENCE_DEPT_IDS: ReadonlySet<string> = new Set(
  departments
    .filter((d) => !d.versions || d.versions.includes("sciences"))
    .map((d) => d.id)
);

// 学科 ID が理系学科かどうか。
export function isScienceDept(id: string): boolean {
  return SCIENCE_DEPT_IDS.has(id);
}

// 学科 + バージョンから「リング上のスロット」を取得
//   humanities/sciences: 8スロット（humSlot/sciSlot）
//   mixed: 9カテゴリ（categoryIndex 0-8）
export function getSlot(dept: Department, version: Version): number | undefined {
  if (version === "humanities") return dept.humSlot;
  if (version === "sciences") return dept.sciSlot;
  return dept.categoryIndex;
}

// ===== mixed リングの制御点並び（9×4＝36学科）=====
// 確定デザイン new9x4r_A の方式 = 「36学科を 22軸由来の確定順に並べ、各学科の適合度を
// 制御点として 144本のリングを描く」（カテゴリ集約9点ではなく学科単位36点）。
// 並び＝ grouping_9x4_revcolor.json の member 順（categoryIndex 0→8、各カテゴリ内も確定順）。
// 12時(0°) = seam（経営工[cat8紫]↔数学[cat0青]の境界）、faculty0=数学 中心が 5°（12時のすぐ右）。
export const MIXED_RING_ORDER: readonly string[] = [
  // cat0 数理・情報
  "math", "info-sci", "data-sci", "info-eng",
  // cat1 物理・化学
  "physics", "chemistry", "applied-chem", "life-chem",
  // cat2 機械・材料
  "mechanical", "electrical", "chem-eng", "materials-eng",
  // cat3 建設・環境
  "architecture", "civil-eng", "earth-sci", "agriculture",
  // cat4 生命・医療
  "biology", "medicine", "dentistry", "veterinary",
  // cat5 健康・こころ
  "pharmacy", "nursing", "psychology", "sports-sci",
  // cat6 教育・人文
  "education", "literature", "philosophy", "foreign-lang",
  // cat7 法・政治・社会
  "law", "politics", "sociology", "intl-relations",
  // cat8 経済・経営
  "economics", "business", "commerce", "mgmt-eng",
] as const;

// MIXED_RING_ORDER の各学科の categoryIndex（→ CATEGORY_COLORS で色を引く）。
// 4学科ごとに同じ category なのでカテゴリ内は同色・境界だけ補間 → 9色グラデを維持。
export const MIXED_RING_CATEGORY_INDEX: readonly number[] = MIXED_RING_ORDER.map(
  (id) => {
    const d = departments.find((x) => x.id === id);
    if (!d) throw new Error(`MIXED_RING_ORDER unknown id: ${id}`);
    return d.categoryIndex;
  }
);

// バージョン別のリング制御点数（mixed=36学科 / humanities=sciences=8カテゴリ）。
export function ringStrengthCount(version: Version): number {
  return version === "mixed"
    ? MIXED_RING_ORDER.length
    : VERSION_CATEGORY_NAMES[version].length;
}

// プレビュー用の均一強度配列（全要素同値＝色だけ見せる円。LP・文理選択で使用）。
// バージョンごとの正しい制御点数で生成する（mixed は 36、sci/hum は 8）。
export function previewStrengths(version: Version, value = 0.7): number[] {
  return new Array(ringStrengthCount(version)).fill(value);
}
