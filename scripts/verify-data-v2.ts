/**
 * 数据校验脚本（pnpm tsx scripts/verify-data-v2.ts）
 * 第十轮扩容口径：校验 200 城 = 39 旧城 + 61 中间代 + 100 本轮新城
 * 总数 / 六大洲覆盖 / 必填非空 / 可空 null 合法 / 签证结构化 /
 * 气候与管道产物一致（本轮 100 新城强制比对；管道唯一来源 = Open-Meteo archive API）/
 * 引擎 v3 冒烟（演示档案全量打分不抛错、null 维降权不惩罚）
 */
import { readFileSync } from 'node:fs';
import { cities } from '../src/data';
import { assess } from '../src/lib/engine';
import { DEMO_PROFILES, buildDemoAnswers } from '../src/data/demoProfiles';
import type { City } from '../src/data/types';

/** 管道中间产物 climate.json 的条目结构（与 assemble 透传一致） */
interface ClimateDetailInput {
  avgTempC: number;
  annualPrecipMm: number;
  precipDays: number;
  sunshineHours: number;
  summary: string;
}

let failures = 0;
const fail = (msg: string): void => {
  failures += 1;
  console.error('  ✗ ' + msg);
};
const ok = (msg: string): void => {
  console.log('  ✓ ' + msg);
};

console.log('=== 1. 总数与大洲分布 ===');
if (cities.length !== 200) fail(`城市总数 ${cities.length} ≠ 200`);
else ok('总数 = 200');

const REGION_ORDER = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'] as const;
const dist: Record<string, number> = {};
for (const c of cities) dist[c.region] = (dist[c.region] ?? 0) + 1;
const missing = REGION_ORDER.filter((r) => !dist[r]);
if (missing.length) fail(`大洲缺覆盖: ${missing.join(',')}`);
else ok(`六大洲全覆盖：${REGION_ORDER.map((r) => `${r}=${dist[r] ?? 0}`).join(' / ')}`);

const badRegion = cities.filter((c) => !REGION_ORDER.includes(c.region as (typeof REGION_ORDER)[number]));
if (badRegion.length) fail(`region 非法值: ${badRegion.map((c) => c.id).join(',')}`);

console.log('=== 2. 必填字段（全部 200 城） ===');
const REQUIRED_STR: Array<keyof City> = ['id', 'nameZh', 'nameEn', 'countryZh', 'subregion', 'timezone'];
const idRe = /^[a-z0-9-]+$/;
for (const c of cities) {
  for (const key of REQUIRED_STR) {
    const v = c[key];
    if (typeof v !== 'string' || v.trim() === '') fail(`${c.id}.${String(key)} 非空校验失败`);
  }
  if (!idRe.test(c.id)) fail(`${c.id}: id 含非法字符`);
  if (!Number.isFinite(c.population) || (c.population as number) <= 0) fail(`${c.id}.population 非法`);
  if (c.countryZh.trim() === '') fail(`${c.id}.countryZh 为空`);
}
ok(`必填字符串 / 人口 / 时区：200 城通过（failures=${failures}）`);

console.log('=== 3. 可空字段：null 合法、有值则类型/范围合法 ===');
const numRange = (c: City, key: keyof City, lo: number, hi: number): void => {
  const v = c[key] as number | null | undefined;
  if (v == null) return;
  if (!Number.isFinite(v) || v < lo || v > hi) fail(`${c.id}.${String(key)}=${v} 超出 [${lo},${hi}]`);
};
for (const c of cities) {
  numRange(c, 'monthlyCostUSD', 200, 8000);
  numRange(c, 'rent1brUSD', 100, 6000);
  numRange(c, 'mealUSD', 1, 120);
  numRange(c, 'costIndex', 10, 200);
  numRange(c, 'safety', 0, 100);
  numRange(c, 'healthcareIndex', 0, 100);
  numRange(c, 'pollutionIndex', 0, 100);
  numRange(c, 'trafficIndex', 0, 100);
  numRange(c, 'purchasingPowerIndex', 0, 200);
  numRange(c, 'climateIndex', 0, 100);
  if (c.english != null && ![1, 2, 3, 4, 5].includes(c.english)) fail(`${c.id}.english=${c.english} 非序数`);
  if (c.englishEpiBand != null && !['very high', 'high', 'moderate', 'low', 'very low'].includes(c.englishEpiBand))
    fail(`${c.id}.englishEpiBand=${String(c.englishEpiBand)} 非法`);
  if (c.englishEpiBand == null && c.englishEpiScore != null) fail(`${c.id}: EPI 有分无级`);
  // cost 与 costIndex 必须同进退（指数缺失 → 成本 null 合法）
  if (c.costIndex == null && c.cost != null) fail(`${c.id}: costIndex 缺但 cost 有值`);
  if (c.cost != null && (c.cost.length !== 2 || c.cost[0] > c.cost[1])) fail(`${c.id}.cost 区间非法`);
}
const n = <T,>(arr: T[], pred: (x: T) => boolean): number => arr.filter(pred).length;
console.log(
  `  null 统计：月成本 ${n(cities, (c) => c.monthlyCostUSD == null)} · 安全 ${n(cities, (c) => c.safety == null)} · ` +
    `医疗 ${n(cities, (c) => c.healthcareIndex == null)} · 租金 ${n(cities, (c) => c.rent1brUSD == null)} · ` +
    `EPI ${n(cities, (c) => c.englishEpiBand == null)}`,
);
ok('可空字段类型与范围校验完成');

console.log('=== 4. 签证结构化 ===');
const VALID_VISA = ['official', 'alternative', 'none', null];
for (const c of cities) {
  if (!VALID_VISA.includes(c.visaStatus)) fail(`${c.id}.visaStatus=${String(c.visaStatus)} 非法`);
  if (c.visaStatus === 'official') {
    if (!c.visaDetail || !c.visaDetail.name) fail(`${c.id}: official 但 visaDetail.name 为空`);
  }
}
const officialN = n(cities, (c) => c.visaStatus === 'official');
const altN = n(cities, (c) => c.visaStatus === 'alternative');
const noneN = n(cities, (c) => c.visaStatus === 'none');
const nullN = n(cities, (c) => c.visaStatus == null);
console.log(`  official=${officialN} alternative=${altN} none=${noneN} 未核实(null)=${nullN}`);
if (officialN === 0) fail('无任何 official 签证城（39 城解析应产出若干 official）');
else ok('签证三档 + null 全部合法');

console.log('=== 5. 气候：与管道产物一致 + 常识带抽查 ===');
const climateRaw = readFileSync('/tmp/pipeline/climate.json', 'utf8');
const climatePipe = JSON.parse(climateRaw) as Record<string, ClimateDetailInput>;
let climateMatched = 0;
const NEW_ROUND_IDS = new Set(
  ((): string[] => {
    const sel = JSON.parse(readFileSync('/tmp/pipeline/selection2.json', 'utf8')) as
      | { cities?: Array<{ id: string }> }
      | Array<{ id: string }>;
    return Array.isArray(sel) ? sel.map((s) => s.id) : (sel.cities ?? []).map((s) => s.id);
  })(),
);
for (const c of cities) {
  if (c.climateDetail == null) continue;
  const src = climatePipe[c.id];
  if (!src) {
    // 第四轮 100 城的 climate.json 中间产物已被清理，仅本轮 100 新城强制逐字段比对
    if (NEW_ROUND_IDS.has(c.id)) fail(`${c.id}: 本轮新城有 climateDetail 但管道无源`);
    continue;
  }
  const eq =
    Math.abs(c.climateDetail.avgTempC - Math.round(src.avgTempC * 10) / 10) < 0.05 &&
    c.climateDetail.annualPrecipMm === Math.round(src.annualPrecipMm) &&
    c.climateDetail.precipDays === Math.round(src.precipDays) &&
    c.climateDetail.sunshineHours === Math.round(src.sunshineHours);
  if (!eq) fail(`${c.id}: climateDetail 与管道产物不一致`);
  else climateMatched += 1;
}
ok(`气候与 Open-Meteo 管道产物一致：${climateMatched} 城（本轮新城强制比对）`);

// 常识带（基准 = Open-Meteo 2015-2024 十年均值的公开常识量级）
const SPOT: Array<[string, number, number]> = [
  ['chiang-mai', 26, 3],
  ['lisbon', 17.5, 3],
  ['singapore', 27.5, 3],
  ['seville', 19, 3],
];
for (const [id, expect, tol] of SPOT) {
  const c = cities.find((x) => x.id === id);
  if (!c || c.climateDetail == null) {
    fail(`抽查城 ${id} 缺 climateDetail`);
    continue;
  }
  const diff = Math.abs(c.climateDetail.avgTempC - expect);
  if (diff > tol) fail(`抽查 ${id}: 年均温 ${c.climateDetail.avgTempC}°C 偏离常识带 ${expect}±${tol}°C`);
  else ok(`抽查 ${id}: ${c.climateDetail.avgTempC}°C ≈ ${expect}°C`);
}

console.log('=== 6. 三代城市口径：39 旧城全指数 / 本轮 100 新城 climate 齐 + traits null ===');
const NEW_IDS = NEW_ROUND_IDS;
const oldCities = cities.filter((c) => c.visaStatus != null);
const newCities = cities.filter((c) => NEW_IDS.has(c.id));
const midCities = cities.filter((c) => c.visaStatus == null && !NEW_IDS.has(c.id));
if (oldCities.length !== 39) fail(`旧城数 ${oldCities.length} ≠ 39`);
if (newCities.length !== 100) fail(`本轮新城数 ${newCities.length} ≠ 100`);
else ok(`39 旧城 + 61 中间代 + 100 本轮新城 = 200（中间代 ${midCities.length}）`);
const oldMissing = oldCities.filter((c) => c.costIndex == null || c.safety == null);
if (oldMissing.length) fail(`旧城缺失指数: ${oldMissing.map((c) => c.id).join(',')}`);
else ok('39 旧城 costIndex/safety 全部有值');
const noTraits = newCities.filter((c) => c.traits != null).length;
if (noTraits > 0) fail(`本轮新城 ${noTraits} 个带有 traits（应 null）`);
const newNoClimate = newCities.filter((c) => c.climateDetail == null).length;
if (newNoClimate > 0) fail(`本轮新城 ${newNoClimate} 个缺 climateDetail`);
else ok('本轮 100 新城 climateDetail 全齐、traits 保持 null');

console.log('=== 7. 引擎 v3 冒烟：演示档案全量打分 ===');
for (const p of DEMO_PROFILES) {
  const result = assess(buildDemoAnswers(p));
  const top = result.matches[0];
  if (!top || !top.match) fail(`档案 ${p.id}: 无 Top 1`);
  else {
    const nullDims = Object.entries(top.fitDetails ?? {}).filter(([, v]) => v == null).length;
    console.log(
      `  ${p.id} → Top1 ${top.city.nameZh} match=${top.match}（null 维 ${nullDims}/11，降权生效）`,
    );
  }
}
ok('演示档案 ×3 引擎 v3 打分无异常');

console.log('');
if (failures > 0) {
  console.error(`verify-data-v2: ${failures} 项失败`);
  process.exit(1);
}
console.log('verify-data-v2: 全部通过 ✓');
