import {
  departments,
  AXIS_COUNT,
  getSlot,
  VERSION_CATEGORY_NAMES,
  MIXED_RING_ORDER,
  VERSION_RING_ORDER,
  type Department,
} from "./departments";
import { type Question, type Version } from "./questions";

// バージョン別の計測軸（質問が存在する軸の集合）。
// 計測されない軸に学科スコアが値を持つと「測れない軸の値が大きい学科」が
// 不当に不利/有利になるため、距離計算から除外する（ユーザー側・学科側とも）。
//   humanities: MATH/LAB を 2026-05-18 で追加（M1/M2/M3/L3）
//   mixed/sciences: PURE(19)/BIO(20)/PROC(21) を 2026-06-12 で追加。
//     humanities には追加しない（B原則: その質問が見分ける学科が候補に出る版だけに入れる）
const MEASURED_AXES: Record<Version, ReadonlySet<number>> = {
  mixed: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]),
  humanities: new Set([0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18]),
  sciences: new Set([0, 1, 2, 3, 4, 5, 7, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21]),
};

// 質問配列とユーザー回答から22軸スコアを算出
//
// 軸別正規化 (min/max): クリップなし
// 逆転項目のマイナス化: 1→+3, 2→+2, 3→0, 4→-2, 5→-3
//
// バージョン対応（2026-04-25）:
//   バージョンごとに質問数が異なるため、質問配列を引数で受け取る。
//   軸ごとの min/max は与えられた質問群から動的に計算する。

const REVERSE_MAP = [3, 2, 0, -2, -3];

export function calcAxisScores(
  answers: number[],
  questions: Question[]
): number[] {
  const axisSums: number[] = new Array(AXIS_COUNT).fill(0);
  const axisMins: number[] = new Array(AXIS_COUNT).fill(0);
  const axisMaxs: number[] = new Array(AXIS_COUNT).fill(0);

  for (const q of questions) {
    if (q.reverse) {
      axisMins[q.axisIndex] += -3;
      axisMaxs[q.axisIndex] += 3;
    } else {
      axisMins[q.axisIndex] += 1;
      axisMaxs[q.axisIndex] += 5;
    }
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const raw = answers[i];
    if (q.reverse) {
      axisSums[q.axisIndex] += REVERSE_MAP[raw - 1];
    } else {
      axisSums[q.axisIndex] += raw;
    }
  }

  const axisScores: number[] = [];
  for (let axis = 0; axis < AXIS_COUNT; axis++) {
    const range = axisMaxs[axis] - axisMins[axis];
    axisScores.push(range > 0 ? (axisSums[axis] - axisMins[axis]) / range : 0);
  }

  return axisScores;
}

// ============================================================
// 判定式 v2（2026-06-12 導入。旧コサイン類似度から置換）
//
//   score = −wL2_var(γ=0.7) − G × Σ_{必須軸} max(0, thr − x_i)
//
// - wL2_var: 分散重み付きユークリッド距離。重み w_i = (std_i + ε)^γ、
//   std_i は当該バージョンに出現する学科間の軸別標準偏差。
//   コサインが捨てる「絶対差」を使うことで近接学科（化学系等）の分離が向上
//   （検証: 2026-06-09 判定法サーベイ。mean 同等・最弱学科+14pt・化学系+8pt）
// - 必須軸ゲート: 学科ベクトル ≥ ESSENTIAL(0.8) の計測軸を「必須」とし、
//   ユーザーが GATE_THRESHOLD(0.45) を下回った分だけ減点（除外ではない）。
//   核を欠いた偽物の top1 を棄却（検証: 2026-06-09 ゲート微調整スイープ。
//   復元率コスト0で棄却100%）
// - GRAD軸(13) は必須軸から除外（「数学好きだが院非志望」を守る）。
//   gradExempt 学科（医・獣医）は距離計算からも軸13を除外（旧実装と同義）
// - 決定の経緯: secretary/notes/archive/2026-06-09-decisions.md・
//   2026-06-10-decisions.md（v2出荷はオーナー決定 06-10 16:55）
// ============================================================

const GAMMA = 0.7; // 分散重みの指数
const GATE_STRENGTH = 2.0; // ゲート減点の強さ G
const GATE_THRESHOLD = 0.45; // 必須軸の絶対閾値 thr
const ESSENTIAL = 0.8; // 学科ベクトルがこの値以上の軸 = 必須軸
const GRAD_AXIS = 13;
const EPS = 1e-9;

// 表示スコア較正: similarity = exp(−SIM_K × (dist + G×pen)^SIM_P)
// 実効距離の単調減少変換なので順位は不変。理想プロフィール本人の自己マッチが
// 概ね 90 前後、無関係学科でも 10-20 程度に落ち着くよう較正
//（検証: analysis/2026-06-12-v2-verify.md。二乗 exp(−0.6d²) は最下位が0%に
// 張り付き表示として不自然だったため d^1.5 に変更）
const SIM_K = 0.35;
const SIM_P = 1.5;

type VersionContext = {
  filtered: Department[];
  weights: number[]; // 軸別の分散重み（非計測軸は0）
  essentialAxes: Set<number>[]; // filtered と同順の必須軸集合
  measured: number[]; // 計測軸のリスト
};

const contextCache = new Map<Version, VersionContext>();

function getVersionContext(version: Version): VersionContext {
  const cached = contextCache.get(version);
  if (cached) return cached;

  const filtered = departments.filter(
    (d) => !d.versions || d.versions.includes(version)
  );
  const measured = [...MEASURED_AXES[version]];

  // 軸別標準偏差 → 分散重み
  const weights: number[] = new Array(AXIS_COUNT).fill(0);
  for (const i of measured) {
    let mean = 0;
    for (const d of filtered) mean += d.scores[i];
    mean /= filtered.length;
    let varSum = 0;
    for (const d of filtered) varSum += (d.scores[i] - mean) ** 2;
    weights[i] = Math.pow(Math.sqrt(varSum / filtered.length) + EPS, GAMMA);
  }

  // 学科ごとの必須軸（GRAD除外）
  const essentialAxes = filtered.map(
    (d) =>
      new Set(
        measured.filter((i) => i !== GRAD_AXIS && d.scores[i] >= ESSENTIAL)
      )
  );

  const ctx: VersionContext = { filtered, weights, essentialAxes, measured };
  contextCache.set(version, ctx);
  return ctx;
}

// dist + ゲート減点（小さいほど良い「実効距離」）を返す
function effectiveDistance(
  userScores: number[],
  dept: Department,
  deptIndex: number,
  ctx: VersionContext
): number {
  let sum = 0;
  for (const i of ctx.measured) {
    if (i === GRAD_AXIS && dept.gradExempt) continue;
    const diff = userScores[i] - dept.scores[i];
    sum += ctx.weights[i] * diff * diff;
  }
  const dist = Math.sqrt(sum);

  let penalty = 0;
  for (const i of ctx.essentialAxes[deptIndex]) {
    if (userScores[i] < GATE_THRESHOLD) penalty += GATE_THRESHOLD - userScores[i];
  }

  return dist + GATE_STRENGTH * penalty;
}

export type DeptResult = {
  department: Department;
  similarity: number;
  score: number;
};

// 全32学科を判定式v2でランキング
// version を渡すと、文系版/理系版でフィルタ済みの結果を返す
// similarity は実効距離の単調減少変換（0..1）。順位は実効距離の昇順と一致する
export function rankDepartments(
  axisScores: number[],
  version: Version = "mixed"
): DeptResult[] {
  const ctx = getVersionContext(version);
  const results = ctx.filtered.map((dept, di) => {
    const effDist = effectiveDistance(axisScores, dept, di, ctx);
    const similarity = Math.exp(-SIM_K * Math.pow(effDist, SIM_P));
    return {
      department: dept,
      similarity,
      score: Math.round(similarity * 100),
    };
  });

  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}

// 上位3カテゴリを特定
export function getTop3Categories(results: DeptResult[]): number[] {
  const seen = new Set<number>();
  const top: number[] = [];

  for (const r of results) {
    const cat = r.department.categoryIndex;
    if (!seen.has(cat)) {
      seen.add(cat);
      top.push(cat);
      if (top.length === 3) break;
    }
  }

  return top;
}

// カテゴリごとの強度（= 各カテゴリ内 similarity 平均。リング描画用）。
// カテゴリ数 N はバージョンで可変（mixed=9 / humanities=sciences=8）。
// VERSION_CATEGORY_NAMES[version].length を正としてハードコード(8)を排除。
export function calcCategoryStrengths(
  results: DeptResult[],
  version: Version = "mixed"
): number[] {
  const n = VERSION_CATEGORY_NAMES[version].length;
  const strengths: number[] = new Array(n).fill(0);
  const counts: number[] = new Array(n).fill(0);

  for (const r of results) {
    const slot = getSlot(r.department, version);
    if (slot === undefined) continue;
    strengths[slot] += r.similarity;
    counts[slot]++;
  }

  for (let i = 0; i < n; i++) {
    if (counts[i] > 0) {
      strengths[i] = strengths[i] / counts[i];
    }
  }

  return strengths;
}

// mixed リング（9×4＝36制御点）の強度。確定デザイン new9x4r_A の方式：
// 「36学科を確定順（MIXED_RING_ORDER）に並べ、各学科の similarity をそのまま制御点にする」。
// カテゴリ集約（9点平均）ではなく学科単位 36点。Ring.tsx が 144本をコサイン補間で描く。
// 値はユーザー内 min-max 正規化を Ring.tsx 側で行うため、ここでは生 similarity を返す。
export function calcMixedRingStrengths(results: DeptResult[]): number[] {
  const byId = new Map(results.map((r) => [r.department.id, r.similarity]));
  return MIXED_RING_ORDER.map((id) => byId.get(id) ?? 0);
}

// バージョンに応じたリング制御点配列を返す統一エントリ（揺らぎ AnimatedRing・LP プレビュー用）。
//   mixed: 36学科の similarity（MIXED_RING_ORDER 順）
//   humanities/sciences: 8カテゴリ強度（従来の集約モデル）
// ※ 結果画面の静止リングは学科単位の calcResultRingStrengths を使う（別系統）。
export function calcRingStrengths(
  results: DeptResult[],
  version: Version = "mixed"
): number[] {
  if (version === "mixed") return calcMixedRingStrengths(results);
  return calcCategoryStrengths(results, version);
}

// 結果画面リング（静止 drawRing・学科単位）の制御点。全版とも「各学科の similarity を
// 版別の確定並び順 VERSION_RING_ORDER に並べる」。mixed=36 / 理系=24 / 文系=13。
// 色は版別カテゴリ色（VERSION_RING_CATEGORY_INDEX）で学科ごとに引く。
// 2026-06-19 本番反映：理系/文系を 8カテゴリ集約から学科単位へ（揺らぎは calcRingStrengths のまま）。
export function calcResultRingStrengths(
  results: DeptResult[],
  version: Version = "mixed"
): number[] {
  const byId = new Map(results.map((r) => [r.department.id, r.similarity]));
  return VERSION_RING_ORDER[version].map((id) => byId.get(id) ?? 0);
}
