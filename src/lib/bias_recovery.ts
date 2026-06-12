import { getQuestionsForVersion, type Version } from "./questions";
import { calcAxisScores, rankDepartments } from "./scoring";
import { departments } from "./departments";
import * as fs from "fs";

const M = parseInt(process.argv[2] || "50000", 10); // 1学科あたりの合成受験生数
const DATE = "2026-06-09";
const HI = 0.55, LO = 0.20;
const MEASURED: Record<Version, number[]> = {
  mixed: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
  humanities: [0,1,2,3,6,7,8,9,10,11,12,13,16,17,18],
  sciences: [0,1,2,3,4,5,7,10,11,12,13,14,15,18],
};

function scoreV2(x: number[], dept: any, axes: number[], useLow: boolean): [number, number] {
  let pen = 0, dist2 = 0;
  for (const ax of axes) {
    if (dept.gradExempt && ax === 13) continue;
    const t = dept.scores[ax], xi = x[ax];
    dist2 += (xi - t) * (xi - t);
    if (t >= HI) { const sh = t - xi; if (sh > 0) pen += t * sh; }
    else if (t <= LO) { if (useLow) { const ex = xi - t; if (ex > 0) pen += 0.4 * ex; } }
  }
  return [pen, dist2];
}

function clamp(v: number) { return v < 1 ? 1 : v > 5 ? 5 : v; }

// 学科dの「理想受験生」の回答を生成（targetに沿う＋ノイズ）。reverse質問は逆向きに。
function genAnswer(q: any, target: number): number {
  // 目標寄与が高い軸 → normal:5, reverse:1。低い軸 → normal:1, reverse:5。
  const ideal = q.reverse ? (1 + 4 * (1 - target)) : (1 + 4 * target);
  const noise = ((Math.random() * 3) | 0) - 1; // -1,0,1
  return clamp(Math.round(ideal + noise));
}

const versions: { v: Version; label: string }[] = [
  { v: "mixed", label: "文理混合（mixed）" },
  { v: "sciences", label: "理系（sciences）" },
  { v: "humanities", label: "文系（humanities）" },
];

let md = `# 復元率テスト：各学科の「理想受験生」を当てられるか（学科あたり${M.toLocaleString()}人合成）\n\n`;
md += `**生成日**: ${DATE}\n**指標**: 学科Dのプロフィールに沿う受験生を合成 → モデルがDを1位に出せた割合（top1）／top3割合。\n`;
md += `高いほど「狙った適性を正しく拾える」良いモデル。適性診断として本質的な精度。\n\n---\n`;

for (const { v, label } of versions) {
  const questions = getQuestionsForVersion(v);
  const axes = MEASURED[v];
  const fd = departments.filter((d: any) => !d.versions || d.versions.includes(v));
  const D = fd.length;
  const idmap = new Map<string, number>(); fd.forEach((d: any, i: number) => idmap.set(d.id, i));

  type R = { name: string; cosT1: number; cosT3: number; aT1: number; bT1: number; bT3: number };
  const res: R[] = [];
  const t0 = Date.now();

  for (const d of fd as any[]) {
    let cosT1 = 0, cosT3 = 0, aT1 = 0, bT1 = 0, bT3 = 0;
    const ans = new Array(questions.length).fill(0);
    for (let m = 0; m < M; m++) {
      for (let j = 0; j < questions.length; j++) ans[j] = genAnswer(questions[j], d.scores[questions[j].axisIndex]);
      const x = calcAxisScores(ans, questions);
      // cosine top3
      const ranked = rankDepartments(x, v);
      if (ranked[0].department.id === d.id) cosT1++;
      if (ranked.slice(0, 3).some(r => r.department.id === d.id)) cosT3++;
      // v2A / v2B argmin + 自分の順位
      let bestA = -1, bpA = Infinity, bdA = Infinity;
      const bpen: { i: number; p: number; di: number }[] = [];
      for (let i = 0; i < D; i++) {
        const [pa, da] = scoreV2(x, fd[i], axes, false);
        if (pa < bpA || (pa === bpA && da < bdA)) { bpA = pa; bdA = da; bestA = i; }
        const [pb, db] = scoreV2(x, fd[i], axes, true);
        bpen.push({ i, p: pb, di: db });
      }
      if (fd[bestA].id === d.id) aT1++;
      bpen.sort((p, q) => p.p - q.p || p.di - q.di);
      if (fd[bpen[0].i].id === d.id) bT1++;
      if (bpen.slice(0, 3).some(p => fd[p.i].id === d.id)) bT3++;
    }
    res.push({ name: d.name, cosT1: cosT1 / M * 100, cosT3: cosT3 / M * 100, aT1: aT1 / M * 100, bT1: bT1 / M * 100, bT3: bT3 / M * 100 });
  }
  const secs = (Date.now() - t0) / 1000;
  console.error(`done ${v}: ${secs.toFixed(1)}s`);

  const avg = (f: (r: R) => number) => res.reduce((a, r) => a + f(r), 0) / res.length;
  md += `\n## ${label}（学科${D}・計算${secs.toFixed(0)}秒）\n\n`;
  md += `**平均復元率（top1）**: コサイン ${avg(r => r.cosT1).toFixed(1)}% ／ v2A ${avg(r => r.aT1).toFixed(1)}% ／ v2B ${avg(r => r.bT1).toFixed(1)}%\n`;
  md += `**平均復元率（top3）**: コサイン ${avg(r => r.cosT3).toFixed(1)}% ／ v2B ${avg(r => r.bT3).toFixed(1)}%\n\n`;
  md += `| 学科 | cos top1 | cos top3 | v2A top1 | v2B top1 | v2B top3 |\n|---|--:|--:|--:|--:|--:|\n`;
  for (const r of res.sort((a, b) => a.cosT1 - b.cosT1)) // 復元しにくい順
    md += `| ${r.name} | ${r.cosT1.toFixed(1)} | ${r.cosT3.toFixed(1)} | ${r.aT1.toFixed(1)} | ${r.bT1.toFixed(1)} | ${r.bT3.toFixed(1)} |\n`;
}

const out1 = `/Users/hiraiichijou/home/my-company/.company/secretary/notes/${DATE}-復元率テスト-cosine-vs-v2.md`;
const out2 = `/Users/hiraiichijou/home/my-company/circle-app/analysis/${DATE}-recovery-test.md`;
fs.writeFileSync(out1, md); fs.writeFileSync(out2, md);
console.error("REPORT WRITTEN: " + out1);
