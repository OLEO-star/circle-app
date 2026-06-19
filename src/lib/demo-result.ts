// ?demo= プレビュー用のダミー診断結果。本番と同じパイプライン
// （rankDepartments → calcResultRingStrengths / getTop3Categories / getSlot）で生成するため、
// 学科数・slot・リング制御点長（mixed 36 / 理系 24 / 文系 13）が常に本番と一致する。
// 旧実装はバージョンごとに results/categoryStrengths をハードコードしていたが、
// 2026-06-19 の学科単位リング化で長さがズレるため、固定ペルソナからの動的生成へ統一。
import {
  rankDepartments,
  calcResultRingStrengths,
  getTop3Categories,
} from "./scoring";
import { getSlot } from "./departments";
import type { Version } from "./questions";

export type StoredResult = {
  version: Version;
  axisScores: number[];
  results: {
    id: string;
    name: string;
    categoryIndex: number;
    slot: number;
    score: number;
    similarity: number;
  }[];
  categoryStrengths: number[];
  top3Categories: number[];
  // 質問ごとの回答変更回数。旧データには無いので optional。
  changeCounts?: number[];
  // 所要時間集計用。quiz/page.tsx が sessionStorage 経由で渡す。
  startTime?: string;
  endTime?: string;
  durationSec?: string;
};

// 各版のデモ用 22軸ペルソナ（プレビューで「らしい」形が出る固定プロフィール）。
//   humanities=文系型（言語・社会・物語が高い） / sciences=理系ものづくり型（実験・量産・数理が高い）
//   mixed=人と関わる・現場・チーム志向型（FIELD/CARE/TEAM が高い）。
//     → top1〜3 が 教育学科/社会学科/心理学科＝3つの別カテゴリで分散する本物の出力になる。
//       2026-06-19 実採点(rankDepartments)で「top1/2/3 が異なるカテゴリ＋1位が明確」を満たす
//       22軸ベクトルを探索して採用（玄関デモが情報系に偏らず学科の幅を見せられるように）。
const DEMO_PERSONAS: Record<Version, number[]> = {
  // MATH MEMO LAB FIELD CODE MAKE LANG CARE BIZ ART ABS TEAM CERT GRAD LIFE ANIMAL NARR JUST BODY PURE BIO PROC
  humanities: [0.10, 0.60, 0.05, 0.20, 0.05, 0.05, 0.95, 0.25, 0.20, 0.60, 0.65, 0.30, 0.20, 0.45, 0.05, 0.05, 0.95, 0.30, 0.10, 0.65, 0.10, 0.05],
  sciences:   [0.55, 0.40, 0.90, 0.10, 0.35, 0.45, 0.15, 0.10, 0.20, 0.05, 0.45, 0.35, 0.20, 0.65, 0.05, 0.05, 0.05, 0.05, 0.10, 0.55, 0.35, 0.70],
  mixed:      [0.027, 0.14, 0.129, 0.667, 0.118, 0.322, 0.033, 0.748, 0.046, 0.11, 0.382, 0.654, 0.349, 0.433, 0.447, 0.221, 0.346, 0.077, 0.24, 0.216, 0.173, 0.194],
};

// デモパラメータ → バージョン。
//   demo=1 / demo=humanities → 文系版 / demo=sciences → 理系版 / demo=mixed → 全学科版
function versionFor(demoParam: string): Version | null {
  if (demoParam === "1" || demoParam === "humanities") return "humanities";
  if (demoParam === "sciences") return "sciences";
  if (demoParam === "mixed") return "mixed";
  return null;
}

// 結果ページの UI を実データなしで確認するためのダミーデータを生成する。
export function buildDemoData(demoParam: string): StoredResult | null {
  const version = versionFor(demoParam);
  if (!version) return null;

  const axisScores = DEMO_PERSONAS[version];
  const ranked = rankDepartments(axisScores, version);
  const results = ranked.map((r) => ({
    id: r.department.id,
    name: r.department.name,
    categoryIndex: r.department.categoryIndex,
    slot: getSlot(r.department, version) ?? r.department.categoryIndex,
    score: r.score,
    similarity: r.similarity,
  }));

  return {
    version,
    axisScores,
    results,
    categoryStrengths: calcResultRingStrengths(ranked, version),
    top3Categories: getTop3Categories(ranked),
  };
}
