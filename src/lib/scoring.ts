import { departments, AXIS_COUNT, getSlot, type Department } from "./departments";
import { type Question, type Version } from "./questions";

// 質問配列とユーザー回答から19軸スコアを算出
//
// 軸別正規化 (min/max): クリップなし（負値を許容してコサイン類似度で逆ベクトル寄与）
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

// コサイン類似度
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function cosineSimilarityForDept(userScores: number[], dept: Department): number {
  const userAdj = [...userScores];
  const deptAdj = [...dept.scores];

  // GRAD軸適用外の学科はGRAD軸を両方ゼロにしてスキップ
  if (dept.gradExempt) {
    userAdj[13] = 0;
    deptAdj[13] = 0;
  }

  return cosineSimilarity(userAdj, deptAdj);
}

export type DeptResult = {
  department: Department;
  similarity: number;
  score: number;
};

// 全32学科とのコサイン類似度を計算しランキング
// version を渡すと、文系版/理系版でフィルタ済みの結果を返す
export function rankDepartments(
  axisScores: number[],
  version: Version = "mixed"
): DeptResult[] {
  const filtered = departments.filter((d) =>
    !d.versions || d.versions.includes(version)
  );
  const results = filtered.map((dept) => {
    const similarity = cosineSimilarityForDept(axisScores, dept);
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

// 8カテゴリごとの強度（リング描画用）
// バージョンによってリング上のスロット割り当てが異なる
export function calcCategoryStrengths(
  results: DeptResult[],
  version: Version = "mixed"
): number[] {
  const strengths: number[] = new Array(8).fill(0);
  const counts: number[] = new Array(8).fill(0);

  for (const r of results) {
    const slot = getSlot(r.department, version);
    if (slot === undefined) continue;
    strengths[slot] += r.similarity;
    counts[slot]++;
  }

  for (let i = 0; i < 8; i++) {
    if (counts[i] > 0) {
      strengths[i] = strengths[i] / counts[i];
    }
  }

  return strengths;
}
