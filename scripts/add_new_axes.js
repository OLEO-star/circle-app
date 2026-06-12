// departments.ts の全32学科 scores 配列（19要素）に PURE/BIO/PROC の3値を追記する
// 値の正本: analysis/2026-06-12-question-addition-design.md §6.3
const fs = require("fs");
const path = "/Users/hiraiichijou/home/my-company/circle-app/src/lib/departments.ts";

const NEW_AXES = {
  "math":           [0.95, 0.05, 0.05],
  "info-sci":       [0.65, 0.10, 0.15],
  "data-sci":       [0.45, 0.15, 0.20],
  "info-eng":       [0.35, 0.10, 0.30],
  "physics":        [0.90, 0.10, 0.10],
  "earth-sci":      [0.65, 0.20, 0.10],
  "chemistry":      [0.85, 0.30, 0.20],
  "applied-chem":   [0.55, 0.30, 0.45],
  "chem-eng":       [0.30, 0.30, 0.75],
  "life-chem":      [0.55, 0.90, 0.30],
  "biology":        [0.60, 0.85, 0.10],
  "agriculture":    [0.40, 0.70, 0.35],
  "medicine":       [0.25, 0.60, 0.05],
  "pharmacy":       [0.40, 0.70, 0.30],
  "nursing":        [0.15, 0.35, 0.05],
  "veterinary":     [0.25, 0.65, 0.05],
  "mechanical":     [0.30, 0.05, 0.50],
  "electrical":     [0.40, 0.05, 0.45],
  "architecture":   [0.25, 0.05, 0.25],
  "sports-sci":     [0.20, 0.40, 0.05],
  "economics":      [0.55, 0.05, 0.10],
  "business":       [0.25, 0.05, 0.25],
  "commerce":       [0.30, 0.05, 0.15],
  "law":            [0.45, 0.00, 0.05],
  "politics":       [0.40, 0.05, 0.05],
  "sociology":      [0.50, 0.05, 0.05],
  "intl-relations": [0.35, 0.05, 0.05],
  "literature":     [0.60, 0.05, 0.00],
  "foreign-lang":   [0.40, 0.05, 0.05],
  "philosophy":     [0.75, 0.05, 0.00],
  "education":      [0.30, 0.10, 0.05],
  "psychology":     [0.55, 0.30, 0.05],
};

let src = fs.readFileSync(path, "utf8");
let patched = 0;
// 学科エントリ単位でマッチ: { id: "xxx", ... scores: [....] }
src = src.replace(
  /\{ id: "([a-z-]+)",([\s\S]*?)scores: \[([^\]]+)\]/g,
  (full, id, mid, scores) => {
    const add = NEW_AXES[id];
    if (!add) throw new Error(`値が未定義の学科: ${id}`);
    const values = scores.split(",").map((s) => s.trim()).filter(Boolean);
    if (values.length !== 19) throw new Error(`${id}: 既存軸数が19でない (${values.length})`);
    patched++;
    const fmt = (v) => (v === 0 ? "0.0" : v === 1 ? "1.0" : String(v));
    return `{ id: "${id}",${mid}scores: [${values.join(", ")}, ${add.map(fmt).join(", ")}]`;
  }
);
if (patched !== 32) throw new Error(`置換数が32でない: ${patched}`);
fs.writeFileSync(path, src);
console.log(`OK: ${patched}学科に3軸を追記`);
