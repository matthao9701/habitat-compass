// 第十二轮扩容：WhereNext（CC BY 4.0）城级月成本 → monthlyCostUSD / cost 区间
// 口径：本轮 30 新城直接采用 WhereNext 城市级月成本估计（ICP 2021 锚定，真实 USD），
//       不走拟合；区间 = ±15/20%（与既有 cost 口径一致）。
//       榜单 livingScore（NYC=100）仍由 backfill-indices.mjs 单独填充，二者互不混淆。
// 只增不改：仅填充 monthlyCostUSD==null 的城。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src/data/cities';
const REGIONS = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'];

const fold = (s) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ø]/g, 'o')
    .replace(/[ł]/g, 'l')
    .replace(/[^a-z0-9]+/g, '');

// id → WhereNext 城名（fold 后不匹配者登记）
const WN_NAME = {};

const files = {};
for (const r of REGIONS) files[r] = JSON.parse(fs.readFileSync(path.join(ROOT, `${r}.json`), 'utf8'));

const wn = JSON.parse(fs.readFileSync('/tmp/wn-cities.json', 'utf8')).data;
const wnByFold = new Map(wn.map((c) => [fold(c.name), c]));
const wnById = new Map();
for (const r of REGIONS) {
  for (const c of files[r]) {
    const name = WN_NAME[c.id] ?? c.nameEn;
    const hit = wnByFold.get(fold(name));
    if (hit && hit.countryCode === c.countryCode) wnById.set(c.id, hit);
  }
}

let filled = 0;
const misses = [];
for (const r of REGIONS) {
  for (const c of files[r]) {
    if (c.monthlyCostUSD != null) continue;
    const w = wnById.get(c.id);
    if (!w || w.monthlyCostEstimate == null) { misses.push(c.id); continue; }
    c.monthlyCostUSD = w.monthlyCostEstimate;
    c.cost = [Math.round(w.monthlyCostEstimate * 0.85), Math.round(w.monthlyCostEstimate * 1.2)];
    filled++;
  }
}
console.log(`WhereNext 成本填充: ${filled} 城`);
if (misses.length) console.log('无 WN 记录:', misses.join(' '));

for (const r of REGIONS) {
  const file = path.join(ROOT, `${r}.json`);
  const orig = fs.readFileSync(file, 'utf8');
  const indent = (orig.match(/\[\n( +)\{/) || [])[1]?.length ?? 1;
  const nl = orig.endsWith('\n') ? '\n' : '';
  fs.writeFileSync(file, JSON.stringify(files[r], null, indent) + nl);
}
console.log('✓ 已写回 6 个城市文件');
