import { getQuestionsForVersion, type Version } from "./questions";
import { calcAxisScores, rankDepartments } from "./scoring";
import { departments } from "./departments";

const version = (process.argv[2] || "mixed") as Version;
const N = parseInt(process.argv[3] || "1000000", 10);

const questions = getQuestionsForVersion(version);
const Q = questions.length;
const filteredDepts = departments.filter(d => !d.versions || d.versions.includes(version));
const counts = new Map<string, number>();
for (const d of filteredDepts) counts.set(d.id, 0);

const answers: number[] = new Array(Q).fill(0);
const t0 = Date.now();
for (let i = 0; i < N; i++) {
  for (let j = 0; j < Q; j++) answers[j] = 1 + ((Math.random() * 5) | 0);
  const axis = calcAxisScores(answers, questions);
  const ranked = rankDepartments(axis, version);
  const top = ranked[0].department.id;
  counts.set(top, (counts.get(top) || 0) + 1);
}
const secs = (Date.now() - t0) / 1000;
console.error(`version=${version} Q=${Q} N=${N} depts=${filteredDepts.length} time=${secs.toFixed(2)}s rate=${(N/secs/1e6).toFixed(2)}M/s`);

// emit results as TSV to stdout
const rows = filteredDepts.map(d => {
  const c = counts.get(d.id) || 0;
  return { id: d.id, name: d.name, pct: (c / N) * 100, c };
}).sort((a,b)=>b.pct-a.pct);
for (const r of rows) console.log(`${r.pct.toFixed(4)}\t${r.name}\t${r.c}`);
