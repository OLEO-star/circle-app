// 32学科 × 22軸 スコアマトリクス
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
  categoryIndex: number; // 0-7（mixed 版のリング位置 = 8カテゴリ）
  scores: number[]; // 22軸スコア
  gradExempt?: boolean; // 医学科・獣医学科: GRAD軸適用外
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

// ===== mixed 版（既存） =====
export const CATEGORY_NAMES = [
  "数理・情報",
  "経済・ビジネス",
  "法・政治・社会",
  "言語・表現",
  "スポーツ・教育",
  "生命・医療",
  "工学・技術",
  "自然科学",
] as const;

export const CATEGORY_COLORS = [
  "#4A7BF7", // 青 - 数理・情報
  "#7B5CF5", // 紫 - 経済・ビジネス
  "#E05A9F", // ピンク - 法・政治・社会
  "#EF5350", // 赤 - 言語・表現
  "#F59B42", // オレンジ - スポーツ・教育
  "#F5D442", // 黄色 - 生命・医療
  "#4CAF50", // 緑 - 工学・技術
  "#42C5D9", // 水色 - 自然科学
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
export const departments: Department[] = [
  // 0: 数理・情報系（理系）
  { id: "math", name: "数学科", categoryIndex: 0, versions: SCI, sciSlot: 0,
    scores: [1.0, 0.3, 0.1, 0.0, 0.3, 0.0, 0.2, 0.0, 0.0, 0.1, 1.0, 0.1, 0.0, 0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.95, 0.05, 0.05] },
  { id: "info-sci", name: "情報科学科", categoryIndex: 0, versions: SCI, sciSlot: 0,
    scores: [0.7, 0.3, 0.2, 0.0, 0.9, 0.3, 0.2, 0.1, 0.2, 0.2, 0.7, 0.4, 0.1, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.65, 0.1, 0.15] },
  { id: "data-sci", name: "データサイエンス学科", categoryIndex: 0, versions: SCI, sciSlot: 0,
    scores: [0.9, 0.2, 0.1, 0.2, 0.8, 0.1, 0.2, 0.1, 0.4, 0.1, 0.6, 0.4, 0.1, 0.4, 0.0, 0.0, 0.0, 0.2, 0.0, 0.45, 0.15, 0.2] },

  // 1: 経済・ビジネス系（文系）
  { id: "economics", name: "経済学科", categoryIndex: 1, versions: HUM, humSlot: 0,
    scores: [0.8, 0.4, 0.0, 0.0, 0.3, 0.0, 0.3, 0.1, 0.5, 0.0, 0.7, 0.2, 0.0, 0.3, 0.0, 0.0, 0.0, 0.3, 0.0, 0.55, 0.05, 0.1] },
  { id: "business", name: "経営学科", categoryIndex: 1, versions: HUM, humSlot: 1,
    scores: [0.4, 0.4, 0.0, 0.1, 0.2, 0.0, 0.3, 0.3, 0.9, 0.1, 0.3, 0.7, 0.2, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.05, 0.25] },
  { id: "commerce", name: "商学科", categoryIndex: 1, versions: HUM, humSlot: 1,
    scores: [0.5, 0.5, 0.0, 0.0, 0.2, 0.0, 0.3, 0.2, 0.9, 0.0, 0.3, 0.4, 0.4, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.05, 0.15] },

  // 2: 法・政治・社会系（文系）
  { id: "law", name: "法学科", categoryIndex: 2, versions: HUM, humSlot: 2,
    scores: [0.1, 0.9, 0.0, 0.0, 0.0, 0.0, 0.4, 0.3, 0.3, 0.0, 0.6, 0.2, 0.7, 0.3, 0.0, 0.0, 0.2, 1.0, 0.0, 0.45, 0.0, 0.05] },
  { id: "politics", name: "政治学科", categoryIndex: 2, versions: HUM, humSlot: 2,
    scores: [0.4, 0.6, 0.0, 0.2, 0.2, 0.0, 0.4, 0.3, 0.3, 0.0, 0.5, 0.3, 0.1, 0.3, 0.0, 0.0, 0.1, 0.8, 0.0, 0.4, 0.05, 0.05] },
  { id: "sociology", name: "社会学科", categoryIndex: 2, versions: HUM, humSlot: 3,
    scores: [0.4, 0.3, 0.0, 0.7, 0.2, 0.0, 0.3, 0.4, 0.1, 0.1, 0.5, 0.4, 0.0, 0.3, 0.0, 0.0, 0.3, 0.4, 0.0, 0.5, 0.05, 0.05] },
  { id: "intl-relations", name: "国際関係学科", categoryIndex: 2, versions: HUM, humSlot: 3,
    scores: [0.3, 0.4, 0.0, 0.4, 0.1, 0.0, 0.8, 0.3, 0.3, 0.1, 0.4, 0.5, 0.1, 0.3, 0.0, 0.0, 0.4, 0.3, 0.0, 0.35, 0.05, 0.05] },

  // 3: 言語・表現系（文系）
  { id: "literature", name: "文学科", categoryIndex: 3, versions: HUM, humSlot: 4,
    scores: [0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.9, 0.1, 0.0, 0.6, 0.5, 0.1, 0.1, 0.4, 0.0, 0.0, 1.0, 0.0, 0.0, 0.6, 0.05, 0.0] },
  { id: "foreign-lang", name: "外国語学科", categoryIndex: 3, versions: HUM, humSlot: 4,
    scores: [0.0, 0.4, 0.0, 0.3, 0.0, 0.0, 1.0, 0.3, 0.2, 0.3, 0.3, 0.3, 0.2, 0.2, 0.0, 0.0, 0.4, 0.0, 0.0, 0.4, 0.05, 0.05] },
  { id: "philosophy", name: "哲学科", categoryIndex: 3, versions: HUM, humSlot: 5,
    scores: [0.2, 0.4, 0.0, 0.0, 0.0, 0.0, 0.8, 0.1, 0.0, 0.4, 0.9, 0.1, 0.0, 0.5, 0.0, 0.0, 0.8, 0.2, 0.0, 0.75, 0.05, 0.0] },

  // 4: スポーツ・教育系（教育=文系 / スポーツ科学=両面 / 心理=文系）
  { id: "education", name: "教育学科", categoryIndex: 4, versions: HUM, humSlot: 7,
    scores: [0.2, 0.4, 0.0, 0.5, 0.1, 0.1, 0.2, 0.9, 0.1, 0.2, 0.3, 0.5, 0.7, 0.2, 0.1, 0.0, 0.2, 0.1, 0.3, 0.3, 0.1, 0.05] },
  { id: "psychology", name: "心理学科", categoryIndex: 4, versions: HUM, humSlot: 6,
    scores: [0.6, 0.4, 0.7, 0.2, 0.3, 0.0, 0.2, 0.7, 0.1, 0.1, 0.5, 0.3, 0.6, 0.5, 0.3, 0.0, 0.3, 0.1, 0.2, 0.55, 0.3, 0.05] },
  { id: "sports-sci", name: "スポーツ科学科", categoryIndex: 4, versions: BOTH, humSlot: 7, sciSlot: 7,
    scores: [0.3, 0.3, 0.4, 0.3, 0.1, 0.0, 0.2, 0.6, 0.3, 0.1, 0.2, 0.6, 0.4, 0.3, 0.1, 0.0, 0.0, 0.0, 1.0, 0.2, 0.4, 0.05] },

  // 5: 生命・医療系（理系）
  { id: "medicine", name: "医学科", categoryIndex: 5, gradExempt: true, versions: SCI, sciSlot: 5,
    scores: [0.4, 1.0, 0.6, 0.5, 0.1, 0.0, 0.3, 0.8, 0.1, 0.0, 0.4, 0.5, 1.0, 0.0, 1.0, 0.1, 0.0, 0.1, 0.4, 0.25, 0.6, 0.05] },
  { id: "pharmacy", name: "薬学科", categoryIndex: 5, versions: SCI, sciSlot: 5,
    scores: [0.5, 0.8, 0.8, 0.3, 0.1, 0.0, 0.2, 0.4, 0.1, 0.0, 0.4, 0.3, 0.9, 0.3, 0.5, 0.0, 0.0, 0.0, 0.1, 0.4, 0.7, 0.3] },
  { id: "nursing", name: "看護学科", categoryIndex: 5, versions: SCI, sciSlot: 5,
    scores: [0.2, 0.7, 0.3, 0.8, 0.0, 0.0, 0.2, 1.0, 0.0, 0.0, 0.2, 0.7, 0.9, 0.1, 0.8, 0.0, 0.1, 0.0, 0.3, 0.15, 0.35, 0.05] },
  { id: "agriculture", name: "農学科", categoryIndex: 5, versions: SCI, sciSlot: 6,
    scores: [0.4, 0.3, 0.7, 0.8, 0.2, 0.1, 0.2, 0.2, 0.1, 0.0, 0.3, 0.3, 0.1, 0.7, 0.3, 0.6, 0.0, 0.0, 0.0, 0.4, 0.7, 0.35] },
  { id: "veterinary", name: "獣医学科", categoryIndex: 5, gradExempt: true, versions: SCI, sciSlot: 6,
    scores: [0.3, 0.9, 0.7, 0.5, 0.1, 0.0, 0.2, 0.7, 0.0, 0.0, 0.3, 0.4, 1.0, 0.0, 0.9, 1.0, 0.0, 0.0, 0.1, 0.25, 0.65, 0.05] },

  // 6: 工学・技術系（理系）
  { id: "mechanical", name: "機械工学科", categoryIndex: 6, versions: SCI, sciSlot: 1,
    scores: [0.8, 0.3, 0.5, 0.1, 0.5, 0.9, 0.1, 0.1, 0.1, 0.1, 0.4, 0.4, 0.1, 0.5, 0.0, 0.0, 0.0, 0.0, 0.1, 0.3, 0.05, 0.5] },
  { id: "electrical", name: "電気電子工学科", categoryIndex: 6, versions: SCI, sciSlot: 1,
    scores: [0.8, 0.3, 0.8, 0.0, 0.6, 0.7, 0.1, 0.1, 0.1, 0.0, 0.5, 0.3, 0.1, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.4, 0.05, 0.45] },
  { id: "architecture", name: "建築学科", categoryIndex: 6, versions: SCI, sciSlot: 1,
    scores: [0.5, 0.3, 0.2, 0.2, 0.2, 0.9, 0.1, 0.3, 0.2, 0.9, 0.3, 0.4, 0.5, 0.4, 0.0, 0.0, 0.3, 0.0, 0.0, 0.25, 0.05, 0.25] },
  { id: "info-eng", name: "情報工学科", categoryIndex: 6, versions: SCI, sciSlot: 0,
    scores: [0.7, 0.2, 0.2, 0.0, 1.0, 0.4, 0.1, 0.1, 0.2, 0.2, 0.5, 0.5, 0.1, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.35, 0.1, 0.3] },

  // 7: 自然科学系（理系・化学系含む）
  { id: "physics", name: "物理学科", categoryIndex: 7, versions: SCI, sciSlot: 2,
    scores: [0.9, 0.3, 0.5, 0.0, 0.3, 0.1, 0.2, 0.0, 0.0, 0.0, 1.0, 0.1, 0.0, 0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.9, 0.1, 0.1] },
  { id: "biology", name: "生物学科", categoryIndex: 7, versions: SCI, sciSlot: 4,
    scores: [0.3, 0.4, 0.8, 0.7, 0.2, 0.0, 0.2, 0.1, 0.0, 0.0, 0.3, 0.2, 0.0, 0.6, 0.2, 0.5, 0.0, 0.0, 0.1, 0.6, 0.85, 0.1] },
  { id: "earth-sci", name: "地球科学科", categoryIndex: 7, versions: SCI, sciSlot: 2,
    scores: [0.5, 0.3, 0.4, 0.9, 0.2, 0.1, 0.2, 0.1, 0.0, 0.1, 0.4, 0.3, 0.0, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.65, 0.2, 0.1] },
  { id: "chemistry", name: "化学科", categoryIndex: 7, versions: SCI, sciSlot: 3,
    scores: [0.5, 0.4, 0.9, 0.0, 0.2, 0.1, 0.2, 0.0, 0.0, 0.0, 0.6, 0.2, 0.0, 0.7, 0.0, 0.0, 0.0, 0.0, 0.0, 0.85, 0.3, 0.2] },
  { id: "applied-chem", name: "応用化学科", categoryIndex: 7, versions: SCI, sciSlot: 3,
    scores: [0.5, 0.4, 0.9, 0.0, 0.2, 0.2, 0.2, 0.0, 0.1, 0.0, 0.4, 0.3, 0.1, 0.7, 0.0, 0.0, 0.0, 0.0, 0.0, 0.55, 0.3, 0.45] },
  { id: "chem-eng", name: "化学工学科", categoryIndex: 7, versions: SCI, sciSlot: 3,
    scores: [0.7, 0.3, 0.7, 0.1, 0.4, 0.4, 0.1, 0.1, 0.2, 0.0, 0.4, 0.4, 0.1, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.3, 0.75] },
  { id: "life-chem", name: "生命化学科", categoryIndex: 7, versions: SCI, sciSlot: 4,
    scores: [0.4, 0.4, 0.8, 0.0, 0.2, 0.0, 0.2, 0.0, 0.1, 0.0, 0.3, 0.2, 0.0, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 0.55, 0.9, 0.3] },
];

// 学科 + バージョンから「リング上のスロット (0-7)」を取得
export function getSlot(dept: Department, version: Version): number | undefined {
  if (version === "humanities") return dept.humSlot;
  if (version === "sciences") return dept.sciSlot;
  return dept.categoryIndex;
}
