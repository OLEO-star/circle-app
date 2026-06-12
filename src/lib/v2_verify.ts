// 2026-06-12 質問追加（PURE/BIO/PROC）＋判定式v2 の本番実装検証
//
// 検証項目:
//  A. 復元率（理想受験生を top1 に当てる率）: 本番 rankDepartments(v2) vs 旧cosine
//     mixed / sciences / humanities の3版。chem4・info2 の改善を確認
//  B. 偽物棄却率: 必須軸を欠いた near-miss をtop1から外せるか
//  C. 表示スコア較正: 自己マッチ similarity と 無関係学科 similarity の分布
//
// 実行: npx tsc src/lib/v2_verify.ts --outDir /tmp/v2out --module commonjs \
//        --target es2020 --moduleResolution node --esModuleInterop
//       node /tmp/v2out/v2_verify.js [M]
import { getQuestionsForVersion, type Version } from "./questions";
import { calcAxisScores, rankDepartments } from "./scoring";
import { departments, AXIS_COUNT } from "./departments";
import * as fs from "fs";

const M = parseInt(process.argv[2] || "3000", 10);
const DATE = "2026-06-12";
const EPS = 1e-9;
const CHEM = ["chemistry", "applied-chem", "chem-eng", "life-chem"];
const INFO = ["info-sci", "info-eng"];

const MEASURED: Record<string, number[]> = {
  mixed: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],
  humanities: [0,1,2,3,6,7,8,9,10,11,12,13,16,17,18],
  sciences: [0,1,2,3,4,5,7,10,11,12,13,14,15,18,19,20,21],
};

function clamp(v: number) { return v < 1 ? 1 : v > 5 ? 5 : v; }
function genAns(q: any, t: number) {
  const ideal = q.reverse ? 1 + 4 * (1 - t) : 1 + 4 * t;
  return clamp(Math.round(ideal + (((Math.random() * 3) | 0) - 1)));
}

let md = `# v2本番実装 検証レポート（${M.toLocaleString()}人/学科）\n\n**生成日**: ${DATE}\n`;
md += `**対象**: 質問追加後（mixed66/sciences58/humanities53・22軸）の本番 scoring.ts（wL2_var γ0.7＋ゲート0.45/G2/GRAD除外）\n`;
md += `**比較**: 旧cosine（計測軸ゼロ化・gradExempt同等）を同一データで再実装\n\n`;

const versions: Version[] = ["mixed", "sciences", "humanities"];
const simSelf: number[] = [];
const simForeign: number[] = [];

for (const v of versions) {
  const questions = getQuestionsForVersion(v);
  const ax = MEASURED[v];
  const fd = departments.filter((d: any) => !d.versions || d.versions.includes(v));
  const D = fd.length;

  // 旧cosine再実装
  function cosScore(x: number[], d: any): number {
    let dt = 0, a = 0, b = 0;
    for (const i of ax) {
      if (i === 13 && d.gradExempt) continue;
      dt += x[i] * d.scores[i]; a += x[i] * x[i]; b += d.scores[i] * d.scores[i];
    }
    return a < EPS || b < EPS ? 0 : dt / Math.sqrt(a * b);
  }

  // 必須軸（ゲート＝v2と同基準・GRAD除外）: 偽物生成用
  const ess = fd.map((d: any) => new Set(ax.filter((i) => i !== 13 && d.scores[i] >= 0.8)));

  const recV2 = new Array(D).fill(0);
  const recCos = new Array(D).fill(0);
  const rejV2 = new Array(D).fill(0);
  let essCount = 0;
  const ans = new Array(questions.length).fill(0);

  for (let di = 0; di < D; di++) {
    const d = fd[di] as any;
    const hasEss = ess[di].size > 0;
    if (hasEss) essCount++;
    for (let m = 0; m < M; m++) {
      // 本物
      for (let j = 0; j < questions.length; j++) ans[j] = genAns(questions[j], d.scores[questions[j].axisIndex]);
      const x = calcAxisScores(ans, questions);
      const ranked = rankDepartments(x, v);
      if (ranked[0].department.id === d.id) recV2[di]++;
      // similarity 較正データ収集
      for (const r of ranked) {
        if (r.department.id === d.id) simSelf.push(r.similarity);
      }
      simForeign.push(ranked[ranked.length - 1].similarity);
      // 旧cosine top1
      let best = 0, bv = -Infinity;
      for (let k = 0; k < D; k++) { const val = cosScore(x, fd[k]); if (val > bv) { bv = val; best = k; } }
      if (best === di) recCos[di]++;
      // 偽物（必須軸を欠落させる）
      if (hasEss) {
        for (let j = 0; j < questions.length; j++) {
          const q: any = questions[j];
          ans[j] = ess[di].has(q.axisIndex) ? (q.reverse ? 5 : 1) : genAns(q, d.scores[q.axisIndex]);
        }
        const xn = calcAxisScores(ans, questions);
        if (rankDepartments(xn, v)[0].department.id !== d.id) rejV2[di]++;
      }
    }
  }

  const pct = (arr: number[]) => arr.map((c) => (c / M) * 100);
  const rV2 = pct(recV2), rCos = pct(recCos);
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const idIdx = (ids: string[]) => ids.map((id) => fd.findIndex((d: any) => d.id === id)).filter((i) => i >= 0);

  md += `\n## ${v}（${questions.length}問・学科${D}）\n\n`;
  md += `| 指標 | 旧cosine | 新v2（本番実装） |\n|---|--:|--:|\n`;
  md += `| 復元 mean | ${mean(rCos).toFixed(1)}% | **${mean(rV2).toFixed(1)}%** |\n`;
  md += `| 復元 min | ${Math.min(...rCos).toFixed(1)}% | **${Math.min(...rV2).toFixed(1)}%** |\n`;
  const ci = idIdx(CHEM);
  if (ci.length) md += `| chem4 復元 | ${mean(ci.map((i) => rCos[i])).toFixed(1)}% | **${mean(ci.map((i) => rV2[i])).toFixed(1)}%** |\n`;
  const ii = idIdx(INFO);
  if (ii.length) md += `| info2 復元 | ${mean(ii.map((i) => rCos[i])).toFixed(1)}% | **${mean(ii.map((i) => rV2[i])).toFixed(1)}%** |\n`;
  const essIdx = fd.map((_, i) => i).filter((i) => ess[i].size > 0);
  if (essIdx.length) md += `| 偽物棄却率（v2のみ・${essIdx.length}学科） | - | **${mean(essIdx.map((i) => (rejV2[i] / M) * 100)).toFixed(1)}%** |\n`;

  // 学科別の明細（chem4 + info2 + 最弱5学科）
  md += `\n学科別（chem4・info2・v2最弱5）:\n\n| 学科 | cosine | v2 |\n|---|--:|--:|\n`;
  const order = fd.map((_, i) => i).sort((a, b) => rV2[a] - rV2[b]);
  const show = new Set([...idIdx(CHEM), ...idIdx(INFO), ...order.slice(0, 5)]);
  for (const i of [...show].sort((a, b) => rV2[a] - rV2[b])) {
    md += `| ${(fd[i] as any).name} | ${rCos[i].toFixed(1)}% | ${rV2[i].toFixed(1)}% |\n`;
  }
}

// C. similarity 較正
simSelf.sort((a, b) => a - b);
simForeign.sort((a, b) => a - b);
const q = (arr: number[], p: number) => arr[Math.floor(arr.length * p)];
md += `\n## 表示スコア較正（similarity = exp(−0.35·effDist^1.5)）\n\n`;
md += `| 分布 | p10 | p50 | p90 |\n|---|--:|--:|--:|\n`;
md += `| 自己マッチ（理想受験生→自学科） | ${(q(simSelf, 0.1) * 100).toFixed(0)} | ${(q(simSelf, 0.5) * 100).toFixed(0)} | ${(q(simSelf, 0.9) * 100).toFixed(0)} |\n`;
md += `| 最下位学科 | ${(q(simForeign, 0.1) * 100).toFixed(0)} | ${(q(simForeign, 0.5) * 100).toFixed(0)} | ${(q(simForeign, 0.9) * 100).toFixed(0)} |\n`;

// 一様ランダム回答者（非理想・実ユーザーに近い荒れた回答）の top1/中央/最下位
{
  const v: Version = "sciences";
  const questions = getQuestionsForVersion(v);
  const tops: number[] = [], mids: number[] = [], lows: number[] = [];
  for (let m = 0; m < 2000; m++) {
    const ans = questions.map(() => 1 + ((Math.random() * 5) | 0));
    const ranked = rankDepartments(calcAxisScores(ans, questions), v);
    tops.push(ranked[0].similarity);
    mids.push(ranked[Math.floor(ranked.length / 2)].similarity);
    lows.push(ranked[ranked.length - 1].similarity);
  }
  tops.sort((a, b) => a - b); mids.sort((a, b) => a - b); lows.sort((a, b) => a - b);
  md += `| ランダム回答者 top1（sciences） | ${(q(tops, 0.1) * 100).toFixed(0)} | ${(q(tops, 0.5) * 100).toFixed(0)} | ${(q(tops, 0.9) * 100).toFixed(0)} |\n`;
  md += `| ランダム回答者 中央順位 | ${(q(mids, 0.1) * 100).toFixed(0)} | ${(q(mids, 0.5) * 100).toFixed(0)} | ${(q(mids, 0.9) * 100).toFixed(0)} |\n`;
  md += `| ランダム回答者 最下位 | ${(q(lows, 0.1) * 100).toFixed(0)} | ${(q(lows, 0.5) * 100).toFixed(0)} | ${(q(lows, 0.9) * 100).toFixed(0)} |\n`;
}
md += `\n軸数チェック: AXIS_COUNT=${AXIS_COUNT}（期待値22）\n`;

const out = `/Users/hiraiichijou/home/my-company/circle-app/analysis/${DATE}-v2-verify.md`;
fs.writeFileSync(out, md);
console.log("REPORT WRITTEN: " + out);
