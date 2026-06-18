// 32学部 適応度デモ（2026-06-17）
//
// 目的: 「8カテゴリ集約」をやめ「32学部それぞれの適応度」でリングを駆動する案の
//   土台として、実エンジン（判定式v2＝scoring.ts）で 32学部の適応度を出力する。
//
//   - 入力 = 22軸のユーザープロファイル（= calcAxisScores が出す中間表現そのもの）。
//     デモ用に3ペルソナを直接 22軸ベクトルで与える（透明性のため値をコメント）。
//   - 出力 = rankDepartments() の similarity（0..1）を ×100 した適応度スコア。
//     これがそのまま「32本のリング制御点（山谷の高さ）」になる。
//   - 比較用に calcCategoryStrengths()（現行8カテゴリ強度）も併記。
//
// 実行:
//   npx tsc src/lib/faculty_fitness_demo.ts --outDir /tmp/ffd --module commonjs \
//     --target es2020 --moduleResolution node --esModuleInterop
//   node /tmp/ffd/faculty_fitness_demo.js

import { rankDepartments, calcCategoryStrengths } from "./scoring";
import {
  departments,
  AXIS_NAMES,
  AXIS_COUNT,
  CATEGORY_NAMES,
  CATEGORY_COLORS,
} from "./departments";

type Persona = { key: string; label: string; axis: number[] };

// 22軸: MATH,MEMO,LAB,FIELD,CODE,MAKE,LANG,CARE,BIZ,ART,ABS,TEAM,CERT,GRAD,LIFE,ANIMAL,NARRATIVE,JUSTICE,BODY,PURE,BIO,PROC
const PERSONAS: Persona[] = [
  {
    key: "A",
    label: "応用化学・ものづくり志向（オーナー型: 実験◎・量産プロセス◎・数理△・応用寄り）",
    axis: [0.55, 0.40, 0.90, 0.10, 0.35, 0.45, 0.15, 0.10, 0.20, 0.05, 0.45, 0.35, 0.20, 0.65, 0.05, 0.05, 0.05, 0.05, 0.10, 0.55, 0.35, 0.70],
  },
  {
    key: "B",
    label: "言語・物語・人文志向（言語◎・物語◎・芸術○・抽象○）",
    axis: [0.10, 0.60, 0.05, 0.20, 0.05, 0.05, 0.95, 0.25, 0.20, 0.60, 0.65, 0.30, 0.20, 0.45, 0.05, 0.05, 0.95, 0.30, 0.10, 0.65, 0.10, 0.05],
  },
  {
    key: "C",
    label: "数理・抽象・情報志向（数学◎・抽象◎・コード○・純粋科学◎・院志向）",
    axis: [0.95, 0.30, 0.15, 0.05, 0.70, 0.10, 0.20, 0.05, 0.25, 0.05, 0.95, 0.30, 0.10, 0.80, 0.0, 0.0, 0.05, 0.10, 0.05, 0.85, 0.10, 0.20],
  },
];

function pad(s: string, n: number): string {
  // 全角を2幅として概算
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 0xff ? 2 : 1;
  return s + " ".repeat(Math.max(0, n - w));
}

function bar(v: number, width = 24): string {
  const filled = Math.round((v / 100) * width);
  return "█".repeat(filled) + "·".repeat(width - filled);
}

console.log("================================================================");
console.log("  32学部 適応度デモ — 判定式v2（version=mixed・全32学部）");
console.log("================================================================\n");

for (const p of PERSONAS) {
  console.log(`\n############ ペルソナ${p.key}: ${p.label} ############\n`);

  // --- 入力: 22軸プロファイル ---
  console.log("[ 診断結果（22軸プロファイル, 0.00-1.00）]");
  const axisLine: string[] = [];
  for (let i = 0; i < AXIS_COUNT; i++) {
    axisLine.push(`${AXIS_NAMES[i]}=${p.axis[i].toFixed(2)}`);
  }
  // 4列で表示
  for (let i = 0; i < axisLine.length; i += 4) {
    console.log("  " + axisLine.slice(i, i + 4).map((s) => pad(s, 16)).join(""));
  }

  // --- 出力: 32学部の適応度（similarity×100）---
  const results = rankDepartments(p.axis, "mixed");
  console.log("\n[ 32学部の適応度ランキング（適応度 = similarity×100）]");
  console.log("  順位 学部" + " ".repeat(14) + "カテゴリ" + " ".repeat(8) + "適応度  バー");
  results.forEach((r, idx) => {
    const cat = CATEGORY_NAMES[r.department.categoryIndex];
    console.log(
      `  ${pad(String(idx + 1), 4)} ${pad(r.department.name, 16)}${pad(cat, 14)}${pad(String(r.score), 5)} ${bar(r.score)}`
    );
  });

  // --- 比較: 現行8カテゴリ強度 ---
  const cat8 = calcCategoryStrengths(results, "mixed");
  console.log("\n[ 比較: 現行リングの8カテゴリ強度（= 各カテゴリ内 similarity 平均）]");
  CATEGORY_NAMES.forEach((name, i) => {
    const v = Math.round(cat8[i] * 100);
    console.log(`  ${pad(name, 14)}${pad(String(v), 5)} ${bar(v)}`);
  });

  // --- 適応度の散らばり（8 vs 32 のコントラスト差を見る）---
  const scores32 = results.map((r) => r.score);
  const min32 = Math.min(...scores32), max32 = Math.max(...scores32);
  const cat8scores = cat8.map((v) => Math.round(v * 100));
  const min8 = Math.min(...cat8scores), max8 = Math.max(...cat8scores);
  console.log(
    `\n  レンジ比較: 32学部 = ${min32}〜${max32}（幅${max32 - min32}） / 8カテゴリ = ${min8}〜${max8}（幅${max8 - min8}）`
  );
}

// =====================================================================
// 参考: 32学部のカテゴリ別 内訳（並びの土台）
// =====================================================================
console.log("\n\n================================================================");
console.log("  参考: 8カテゴリの学部内訳（リング並び替えの土台）");
console.log("================================================================\n");
const byCat: Record<number, string[]> = {};
for (const d of departments) {
  (byCat[d.categoryIndex] ??= []).push(d.name);
}
let total = 0;
CATEGORY_NAMES.forEach((name, i) => {
  const list = byCat[i] ?? [];
  total += list.length;
  const deg = ((list.length / 32) * 360).toFixed(2);
  console.log(
    `  [${i}] ${pad(name, 14)} ${list.length}学部  色${CATEGORY_COLORS[i]}  (案A=学部均等なら ${deg}°)`
  );
  console.log(`        ${list.join(" / ")}`);
});
console.log(`\n  合計 ${total} 学部 / 8カテゴリ`);
console.log("  学部数の内訳: " + CATEGORY_NAMES.map((n, i) => `${(byCat[i] ?? []).length}`).join(", ") + "（= 3,3,4,3,3,5,4,7）");
