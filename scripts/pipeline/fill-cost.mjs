// 第十一轮扩容·方案A：为 livingScore 已就绪但 cost/monthlyCostUSD 为空的城市计算成本区间
// 与 assemble-v2 同口径：用「旧城人工快照」(visaStatus != null) 做最小二乘拟合 cost ~ livingScore，
// 再对缺失城市估 monthlyCostUSD 与 ±区间。只增不改：仅填 cost==null 或 monthlyCostUSD==null。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src/data/cities';
const REGIONS = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'];

function fitCost(pairs) {
  const n = pairs.length;
  const sx = pairs.reduce((s, p) => s + p[0], 0);
  const sy = pairs.reduce((s, p) => s + p[1], 0);
  const sxx = pairs.reduce((s, p) => s + p[0] * p[0], 0);
  const sxy = pairs.reduce((s, p) => s + p[0] * p[1], 0);
  const a = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - a * sx) / n;
  return { a, b };
}

const files = {};
for (const r of REGIONS) files[r] = JSON.parse(fs.readFileSync(path.join(ROOT, `${r}.json`), 'utf8'));

const oldPairs = [];
for (const r of REGIONS) {
  for (const c of files[r]) {
    if (c.visaStatus != null && typeof c.livingScore === 'number' && typeof c.monthlyCostUSD === 'number') {
      oldPairs.push([c.livingScore, c.monthlyCostUSD]);
    }
  }
}
const { a, b } = fitCost(oldPairs);
const estMonthly = (idx) => Math.max(300, Math.min(6000, Math.round(a * idx + b)));
console.log(`成本拟合: monthlyCostUSD = ${a.toFixed(2)} × livingScore + ${b.toFixed(2)}  (n=${oldPairs.length})`);

let filled = 0;
for (const r of REGIONS) {
  for (const c of files[r]) {
    if (typeof c.livingScore !== 'number') continue;
    if (c.monthlyCostUSD == null) {
      c.monthlyCostUSD = estMonthly(c.livingScore);
      filled++;
    }
    if (c.cost == null) {
      c.cost = [Math.round(c.monthlyCostUSD * 0.85), Math.round(c.monthlyCostUSD * 1.2)];
    }
  }
}
console.log(`补齐 cost/monthlyCostUSD: ${filled} 城`);

for (const r of REGIONS) {
  const file = path.join(ROOT, `${r}.json`);
  const orig = fs.readFileSync(file, 'utf8');
  const indent = (orig.match(/\[\n( +)\{/) || [])[1]?.length ?? 1;
  const nl = orig.endsWith('\n') ? '\n' : '';
  fs.writeFileSync(file, JSON.stringify(files[r], null, indent) + nl);
}
console.log('✓ 已写回 6 个城市文件');
