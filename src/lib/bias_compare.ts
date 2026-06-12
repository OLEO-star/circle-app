import { getQuestionsForVersion, type Version } from "./questions";
import { calcAxisScores, rankDepartments } from "./scoring";
import { departments } from "./departments";
import * as fs from "fs";

const N = parseInt(process.argv[2] || "5000000", 10);
const DATE = "2026-06-09";
const HI = 0.55;   // これ以上 = 「高いほど良い」キー軸
const LO = 0.20;   // これ以下 = 「低いほど良い」軸（v2Bのみ罰する）

const MEASURED: Record<Version, number[]> = {
  mixed: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
  humanities: [0,1,2,3,6,7,8,9,10,11,12,13,16,17,18],
  sciences: [0,1,2,3,4,5,7,10,11,12,13,14,15,18],
};

const versions: { v: Version; label: string }[] = [
  { v: "mixed", label: "文理混合（mixed）" },
  { v: "humanities", label: "文系（humanities）" },
  { v: "sciences", label: "理系（sciences）" },
];

// v2: 学科理想プロフィールへの「方向付き距離」。penが小さいほど適合。
// useLowWant=false → v2A（高wantのみ。不足だけ罰す、他軸は無視）
// useLowWant=true  → v2B（A＋低want軸の上振れも罰す）
function scoreV2(x: number[], dept: any, axes: number[], useLowWant: boolean): [number, number] {
  let pen = 0, dist2 = 0;
  for (const ax of axes) {
    if (dept.gradExempt && ax === 13) continue;
    const t = dept.scores[ax];
    const xi = x[ax];
    dist2 += (xi - t) * (xi - t);            // 同点時のタイブレーク（全体の近さ）
    if (t >= HI) {                            // 高いほど良い：不足分のみ罰、重み=t
      const sh = t - xi; if (sh > 0) pen += t * sh;
    } else if (t <= LO) {                     // 低いほど良い：超過分のみ罰（v2Bのみ）
      if (useLowWant) { const ex = xi - t; if (ex > 0) pen += 0.4 * ex; }
    }                                         // 中間：無関係として無視
  }
  return [pen, dist2];
}

let md = `# 判定モデル比較：コサイン vs v2A(高wantのみ) vs v2B(高want+低want)（各${N.toLocaleString()}回）\n\n`;
md += `**生成日**: ${DATE}\n`;
md += `**v2モデル**: 学科の理想プロフィールへの「方向付き距離」。各軸を t>=${HI}=「高いほど良い(不足を罰)」／ t<=${LO}=「低いほど良い(超過を罰)」／中間=「無関係(無視)」に自動振り分け。\n`;
md += `**前処理(回答→19軸スコア)は3モデル共通**（calcAxisScores）。違いは判定式のみ。\n\n---\n`;

for (const { v, label } of versions) {
  const questions = getQuestionsForVersion(v);
  const Q = questions.length;
  const axes = MEASURED[v];
  const fd = departments.filter((d: any) => !d.versions || d.versions.includes(v));
  const D = fd.length;
  const fair = 100 / D;
  const idx = new Map<string, number>(); fd.forEach((d: any, i: number) => idx.set(d.id, i));

  const cos = new Array(D).fill(0), a2 = new Array(D).fill(0), b2 = new Array(D).fill(0);
  const ans = new Array(Q).fill(0);
  const t0 = Date.now();
  for (let s = 0; s < N; s++) {
    for (let j = 0; j < Q; j++) ans[j] = 1 + ((Math.random() * 5) | 0);
    const x = calcAxisScores(ans, questions);
    // cosine
    cos[idx.get(rankDepartments(x, v)[0].department.id)!]++;
    // v2A / v2B : argmin
    let bestA = 0, bpA = Infinity, bdA = Infinity, bestB = 0, bpB = Infinity, bdB = Infinity;
    for (let i = 0; i < D; i++) {
      const [pa, da] = scoreV2(x, fd[i], axes, false);
      if (pa < bpA || (pa === bpA && da < bdA)) { bpA = pa; bdA = da; bestA = i; }
      const [pb, db] = scoreV2(x, fd[i], axes, true);
      if (pb < bpB || (pb === bpB && db < bdB)) { bpB = pb; bdB = db; bestB = i; }
    }
    a2[bestA]++; b2[bestB]++;
  }
  const secs = (Date.now() - t0) / 1000;
  console.error(`done ${v}: ${secs.toFixed(1)}s`);

  const rows = fd.map((d: any, i: number) => ({
    name: d.name,
    cos: cos[i] / N * 100, a: a2[i] / N * 100, b: b2[i] / N * 100,
  })).sort((x, y) => y.cos - x.cos);

  // 指標
  const stat = (arr: number[]) => {
    const max = Math.max(...arr);
    const nz = arr.filter(p => p >= 0.5).length; // 1位率0.5%以上の学科数
    return { max, nz };
  };
  const sc = stat(rows.map(r => r.cos)), sa = stat(rows.map(r => r.a)), sb = stat(rows.map(r => r.b));

  md += `\n## ${label}（学科${D}・公平基準${fair.toFixed(2)}%・計算${secs.toFixed(0)}秒）\n\n`;
  md += `| 指標 | コサイン | v2A(高wantのみ) | v2B(高+低want) |\n|---|--:|--:|--:|\n`;
  md += `| 最大独占率 | ${sc.max.toFixed(1)}% | ${sa.max.toFixed(1)}% | ${sb.max.toFixed(1)}% |\n`;
  md += `| 1位率≧0.5%の学科数 | ${sc.nz}/${D} | ${sa.nz}/${D} | ${sb.nz}/${D} |\n\n`;
  md += `### 1位率の比較（コサイン降順）\n\n| 学科 | コサイン | v2A | v2B |\n|---|--:|--:|--:|\n`;
  for (const r of rows) md += `| ${r.name} | ${r.cos.toFixed(2)} | ${r.a.toFixed(2)} | ${r.b.toFixed(2)} |\n`;
}

// 尖り学科の役割振り分けを可視化（mixed基準）
md += `\n---\n\n## 参考：自動振り分けの例（mixed・尖り学科）\n\n`;
const axMix = MEASURED.mixed;
for (const id of ["math", "physics", "chemistry", "psychology"]) {
  const d: any = departments.find((x: any) => x.id === id);
  if (!d) continue;
  const hi = axMix.filter(a => d.scores[a] >= HI), lo = axMix.filter(a => d.scores[a] <= LO), mid = axMix.filter(a => d.scores[a] > LO && d.scores[a] < HI);
  md += `- **${d.name}**: 高want軸=${hi.length} / 低want軸=${lo.length} / 無関係軸=${mid.length}\n`;
}

const out1 = `/Users/hiraiichijou/home/my-company/.company/secretary/notes/${DATE}-判定モデル比較-cosine-vs-v2.md`;
const out2 = `/Users/hiraiichijou/home/my-company/circle-app/analysis/${DATE}-model-compare.md`;
fs.writeFileSync(out1, md); fs.writeFileSync(out2, md);
console.error("REPORT WRITTEN: " + out1);
