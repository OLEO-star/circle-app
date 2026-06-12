import { getQuestionsForVersion, type Version } from "./questions";
import { calcAxisScores, rankDepartments } from "./scoring";
import { departments } from "./departments";
import * as fs from "fs";

const N = parseInt(process.argv[2] || "20000000", 10);
const DATE = "2026-06-09";

// scoring.ts の MEASURED_AXES を解析用に複製（尖り度計算用）
const MEASURED: Record<Version, Set<number>> = {
  mixed: new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]),
  humanities: new Set([0,1,2,3,6,7,8,9,10,11,12,13,16,17,18]),
  sciences: new Set([0,1,2,3,4,5,7,10,11,12,13,14,15,18]),
};

const versions: { v: Version; label: string }[] = [
  { v: "mixed", label: "文理混合（mixed・60問）" },
  { v: "humanities", label: "文系（humanities・53問）" },
  { v: "sciences", label: "理系（sciences・52問）" },
];

let md = `# 学部診断 共起・順位・原因分析（モンテカルロ ${N.toLocaleString()}回／バージョン）\n\n`;
md += `**生成日**: ${DATE}\n**内容**: ①1〜5位の出現率 ②「Aが1位のとき top5 に来やすい学科」 ③上位を独占し続ける原因の構造分析\n\n---\n`;

for (const { v, label } of versions) {
  const questions = getQuestionsForVersion(v);
  const Q = questions.length;
  const fd = departments.filter(d => !d.versions || d.versions.includes(v));
  const D = fd.length;
  const fair = 100 / D;
  const idx = new Map<string, number>();
  fd.forEach((d, i) => idx.set(d.id, i));

  const rankCnt: number[][] = Array.from({ length: D }, () => new Array(5).fill(0)); // [dept][rank0-4]
  const top5Cnt = new Array(D).fill(0);
  const rankSum = new Array(D).fill(0); // 平均順位
  const cond: number[][] = Array.from({ length: D }, () => new Array(D).fill(0)); // cond[A1位][B in 2-5位]
  const cooc: number[][] = Array.from({ length: D }, () => new Array(D).fill(0)); // top5 同時出現(無向)

  const answers = new Array(Q).fill(0);
  const t0 = Date.now();
  for (let s = 0; s < N; s++) {
    for (let j = 0; j < Q; j++) answers[j] = 1 + ((Math.random() * 5) | 0);
    const ranked = rankDepartments(calcAxisScores(answers, questions), v);
    for (let r = 0; r < D; r++) rankSum[idx.get(ranked[r].department.id)!] += r + 1;
    const t5: number[] = [];
    for (let r = 0; r < 5 && r < ranked.length; r++) {
      const di = idx.get(ranked[r].department.id)!;
      rankCnt[di][r]++; top5Cnt[di]++; t5.push(di);
    }
    const a = t5[0];
    for (let k = 1; k < t5.length; k++) cond[a][t5[k]]++;
    for (let i = 0; i < t5.length; i++) for (let j = i + 1; j < t5.length; j++) { cooc[t5[i]][t5[j]]++; cooc[t5[j]][t5[i]]++; }
  }
  const secs = (Date.now() - t0) / 1000;
  console.error(`done ${v}: ${secs.toFixed(1)}s`);

  // 中心方向（一様回答の期待＝全測定軸0.5）との類似度＝構造的「中心らしさ」
  const uniform = new Array(19).fill(0.5);
  const structSim = new Map<string, number>();
  rankDepartments(uniform, v).forEach(r => structSim.set(r.department.id, r.similarity));

  // 尖り度（participation ratio: 測定軸での実効活性軸数。低い=尖り、高い=均等）
  const spike = new Map<string, number>();
  for (const d of fd) {
    let sum = 0, sq = 0;
    for (let ax = 0; ax < 19; ax++) if (MEASURED[v].has(ax)) { const x = d.scores[ax]; sum += x; sq += x * x; }
    spike.set(d.id, sq > 0 ? (sum * sum) / sq : 0);
  }

  // 並べ替え（1位率降順）
  const rows = fd.map((d, i) => ({
    name: d.name, id: d.id, i,
    p1: rankCnt[i][0] / N * 100,
    p2: rankCnt[i][1] / N * 100,
    p3: rankCnt[i][2] / N * 100,
    p4: rankCnt[i][3] / N * 100,
    p5: rankCnt[i][4] / N * 100,
    pt5: top5Cnt[i] / N * 100,
    avg: rankSum[i] / N,
     struct: structSim.get(d.id)!,
    spk: spike.get(d.id)!,
  })).sort((a, b) => b.p1 - a.p1);

  md += `\n## ${label}\n\n学科数 ${D} ／ 公平基準(1位率) ${fair.toFixed(2)}% ／ 計算 ${secs.toFixed(0)}秒\n\n`;
  md += `### ① 順位別 出現率（1〜5位）と top5 入り率・平均順位\n\n`;
  md += `| 学科 | 1位 | 2位 | 3位 | 4位 | 5位 | top5入り | 平均順位 |\n|---|--:|--:|--:|--:|--:|--:|--:|\n`;
  for (const r of rows) md += `| ${r.name} | ${r.p1.toFixed(2)} | ${r.p2.toFixed(2)} | ${r.p3.toFixed(2)} | ${r.p4.toFixed(2)} | ${r.p5.toFixed(2)} | ${r.pt5.toFixed(1)} | ${r.avg.toFixed(1)} |\n`;

  md += `\n### ② 「Aが1位のとき、2〜5位に来やすい学科」TOP3\n\n`;
  md += `| 1位の学科 | 相方①(確率) | 相方②(確率) | 相方③(確率) |\n|---|---|---|---|\n`;
  for (const r of rows.filter(x => x.p1 >= fair * 0.5).slice(0, 12)) {
    const total = cond[r.i].reduce((a, b) => a + b, 0);
    const partners = cond[r.i].map((c, j) => ({ name: fd[j].name, prob: total > 0 ? c / (rankCnt[r.i][0]) * 100 : 0 }))
      .filter(p => p.name !== r.name).sort((a, b) => b.prob - a.prob).slice(0, 3);
    md += `| ${r.name} | ${partners.map(p => `${p.name}(${p.prob.toFixed(0)}%)`).join(" | ")} |\n`;
  }

  md += `\n### ③ 原因の構造指標（中心方向との近さ vs 尖り度）\n\n`;
  md += `- **中心類似度** = 「一様回答（全軸0.5）の方向」と学科ベクトルのコサイン。高いほど“どんな回答でも選ばれやすい”。\n`;
  md += `- **実効活性軸数** = 学科ベクトルが何軸に均等に広がっているか（高=均等型、低=尖り型）。\n\n`;
  md += `| 学科 | 1位率 | 中心類似度 | 実効活性軸数 |\n|---|--:|--:|--:|\n`;
  for (const r of rows) md += `| ${r.name} | ${r.p1.toFixed(2)}% | ${r.struct.toFixed(3)} | ${r.spk.toFixed(1)} |\n`;
}

const out1 = `/Users/hiraiichijou/home/my-company/.company/secretary/notes/${DATE}-学部診断-共起と原因分析.md`;
const out2 = `/Users/hiraiichijou/home/my-company/circle-app/analysis/${DATE}-cooccur-cause.md`;
fs.writeFileSync(out1, md);
fs.writeFileSync(out2, md);
console.error("REPORT WRITTEN: " + out1);
