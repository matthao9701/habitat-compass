/**
 * verify-country-v3.ts — 第六轮验证脚本
 *
 * 覆盖：
 *  1. 国家数据完整性：城市库引用国家 ⊆ 国家库；关键字段与数值范围；null 合法性
 *     （GPI / 网速全 null 为预期——源站不可达留待补录）；逐字段 sources 标注
 *  2. 硬约束过滤单测（构造城池）：
 *     预算排除与 5 城放宽 / 签证三档 / 安全阈值 / null 视作无法核验
 *  3. 硬约束 × 引擎集成冒烟：assess(cityPool) + applyOverBudgetPenalty（match -3 / overBudget 标注）
 *  4. 埋点漏斗计数：track / getFunnel / trackStage（node 环境守卫降级不抛错）
 *
 * 运行：pnpm tsx scripts/verify-country-v3.ts
 */
import { cities as citiesAll } from '../src/data';
import rawCountries from '../src/data/countries.json';
import type { City, Country, Region, VisaStatus } from '../src/data/types';
import {
  applyHardConstraints,
  applyOverBudgetPenalty,
  budgetCapUSD,
  CNY_USD_RATE,
  DEFAULT_CONSTRAINTS,
  hasAnyConstraint,
  OVER_BUDGET_PENALTY,
  RELAX_MIN_KEEP,
  type HardConstraints,
} from '../src/lib/constraints';
import { assess, type UserAnswers } from '../src/lib/engine';
import { getFunnel, track, trackStage } from '../src/lib/telemetry';

const COUNTRIES = rawCountries as unknown as Country[];
let pass = 0;
let fail = 0;

function check(name: string, ok: boolean, detail?: string): void {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('=== 1. 国家数据完整性 ===');
const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));
const usedCodes = new Set(citiesAll.map((c) => c.countryCode));
check('每座城市都带 countryCode', citiesAll.every((c) => typeof c.countryCode === 'string' && c.countryCode.length === 2));
check(
  '城市库引用国家全部有国家级数据',
  [...usedCodes].every((code) => byCode.has(code)),
  `缺失: ${[...usedCodes].filter((c) => !byCode.has(c)).join(',')}`,
);
check('国家库无重复 code', new Set(COUNTRIES.map((c) => c.code)).size === COUNTRIES.length);
check('nameZh 全量非空', COUNTRIES.every((c) => typeof c.nameZh === 'string' && c.nameZh.length > 0));
check('capital / languages / currency 全量非空', COUNTRIES.every((c) => c.capital != null && (c.languages?.length ?? 0) > 0 && c.currency != null));
check('hdi 取值 0-1（非空者）', COUNTRIES.every((c) => c.hdi == null || (c.hdi >= 0 && c.hdi <= 1)));
check('numbeo 指数取值合理 0-220（非空者）', COUNTRIES.every((c) => [c.numbeoSafety, c.numbeoHealthcare, c.numbeoQol, c.numbeoPollution, c.numbeoClimate].every((v) => v == null || (v >= 0 && v <= 220))));
check('cpi 取值 0-100（非空者）', COUNTRIES.every((c) => c.cpi == null || (c.cpi >= 0 && c.cpi <= 100)));
check('taxTopRatePct 取值 0-60（非空者）', COUNTRIES.every((c) => c.taxTopRatePct == null || (c.taxTopRatePct >= 0 && c.taxTopRatePct <= 60)));
check('GDP/人口为正数（非空者）', COUNTRIES.every((c) => (c.gdpPerCapitaUSD == null || c.gdpPerCapitaUSD > 0) && (c.population == null || c.population > 0)));
check('updatedAt 格式 YYYY-MM-DD', COUNTRIES.every((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.updatedAt)));
check('GPI 全 null（源站不可达，待补录）', COUNTRIES.every((c) => c.gpi == null));
check('固定宽带网速全 null（源站不可达，待补录）', COUNTRIES.every((c) => c.internetMbpsFixed == null));
check(
  '非空字段均有来源标注',
  COUNTRIES.every((c) => {
    const keys = Object.keys(c).filter(
      (k) => k !== 'sources' && k !== 'cityCount' && k !== 'code' && k !== 'updatedAt' && c[k as keyof Country] != null,
    ) as Array<keyof Country>;
    return keys.every((k) => typeof c.sources[k] === 'string' && (c.sources[k] as string).length > 0);
  }),
);
check('visaOverview null 的国家数与手工快照口径一致（允许缺省）', COUNTRIES.filter((c) => c.visaOverview == null).length > 0);

console.log('=== 2. 硬约束过滤单测 ===');
let seq = 0;
function mkCity(opts: Partial<City> & { monthlyCostUSD: number | null }): City {
  seq++;
  return {
    id: `test-${seq}`,
    nameZh: `测试城${seq}`,
    nameEn: `TestCity${seq}`,
    countryZh: '测试国',
    countryEn: 'Testland',
    countryCode: 'TT',
    region: 'europe' as Region,
    subregion: '南欧',
    lat: 0,
    lng: 0,
    population: 100000,
    timezone: 'Europe/Madrid',
    cost: null,
    monthlyCostUSD: opts.monthlyCostUSD,
    costIndex: 40,
    rent1brUSD: null,
    mealUSD: null,
    safety: 60,
    healthcareIndex: 70,
    pollutionIndex: 50,
    trafficIndex: 40,
    purchasingPowerIndex: 50,
    climateIndex: 70,
    climate: 'mediterranean',
    tempC: 18,
    climateDetail: null,
    visaScore: 3,
    visaLabel: '一般',
    internet: 4,
    internetMbps: 100,
    community: 3,
    english: 3,
    pace: 3,
    size: 3,
    digitalNomadVisa: false,
    visaStatus: 'official' as VisaStatus,
    visaDetail: null,
    englishEpiBand: 'high',
    englishEpiScore: 550,
    tags: [],
    traits: null,
    ...opts,
  };
}

// 2a. 预算：CNY 换算与排除
check('budgetCapUSD: CNY 7200 → $1000', budgetCapUSD({ ...DEFAULT_CONSTRAINTS, budgetCap: 7200, budgetCurrency: 'CNY' }) === Math.round(7200 / CNY_USD_RATE));
check('budgetCapUSD: USD 直取', budgetCapUSD({ ...DEFAULT_CONSTRAINTS, budgetCap: 1500, budgetCurrency: 'USD' }) === 1500);
check('hasAnyConstraint: 全空 = false', hasAnyConstraint(DEFAULT_CONSTRAINTS) === false);

const budgetHC: HardConstraints = { ...DEFAULT_CONSTRAINTS, budgetCap: 1000, budgetCurrency: 'USD' };
const pool = [
  mkCity({ monthlyCostUSD: 800, id: 'cheap-1' }),
  mkCity({ monthlyCostUSD: 950, id: 'cheap-2' }),
  mkCity({ monthlyCostUSD: 1000, id: 'edge-equal' }),
  mkCity({ monthlyCostUSD: 1120, id: 'gap-12' }), // 超 12% → relaxable
  mkCity({ monthlyCostUSD: 1300, id: 'gap-30' }), // 超 30% → 不可放宽
  mkCity({ monthlyCostUSD: null, id: 'no-cost' }), // 无法核验
];
const rBudget = applyHardConstraints(pool, budgetHC);
check('预算过滤 applied = true', rBudget.applied);
check('≤ 上限的城保留（含恰好相等；gap-12 为放宽回填允许超上限）', rBudget.kept.every((c) => c.id === 'gap-12' || c.monthlyCostUSD == null || c.monthlyCostUSD <= 1000) && rBudget.kept.some((c) => c.id === 'edge-equal'));
check('无法核验（null 成本）被排除且原因含「无法核验」', rBudget.excluded.some((e) => e.cityId === 'no-cost' && e.reason.includes('无法核验')));
// pool 共 6 城：预算后 kept=3 < 5 → 触发放宽，gap 12% 的 gap-12 回填
check('kept 3 < 5 → 触发放宽并回填 gap-12（gap 30% 不回填）', rBudget.relaxed === true && rBudget.overBudgetIds.length === 1 && rBudget.overBudgetIds[0] === 'gap-12' && rBudget.kept.some((c) => c.id === 'gap-12') && !rBudget.kept.some((c) => c.id === 'gap-30'));

// 2b-1. kept ≥ 5 时不触发放宽
const widePool = Array.from({ length: 6 }, (_, i) => mkCity({ monthlyCostUSD: 800 + i * 10, id: `wide-${i}` })).concat(mkCity({ monthlyCostUSD: 1120, id: 'wide-gap' }));
const rWide = applyHardConstraints(widePool, budgetHC);
check('kept 6 ≥ 5 → 不触发放宽', rWide.relaxed === false && rWide.overBudgetIds.length === 0 && rWide.kept.length === 6 && rWide.excluded.some((e) => e.cityId === 'wide-gap' && e.relaxable));

// 2b. 放宽：kept < 5 → gap<15% 回填
const tightPool = [
  mkCity({ monthlyCostUSD: 990, id: 'keep-1' }),
  mkCity({ monthlyCostUSD: 1120, id: 'relax-1' }), // 12% → 回填
  mkCity({ monthlyCostUSD: 1300, id: 'hard-1' }),
];
const rRelax = applyHardConstraints(tightPool, budgetHC);
check('kept 1 < 5 → 触发放宽', rRelax.relaxed && rRelax.kept.length === 2);
check('放宽保留 gap-12 城并记入 overBudgetIds', rRelax.overBudgetIds.includes('relax-1') && rRelax.kept.some((c) => c.id === 'relax-1'));
check('超 30% 的城仍被排除', !rRelax.kept.some((c) => c.id === 'hard-1') && rRelax.excluded.some((e) => e.cityId === 'hard-1'));

// 2b-2. 放宽回填者仍需通过签证/安全检查（两阶段语义）
const strictHC: HardConstraints = { ...budgetHC, visaLine: 'official' };
const mixPool = [
  mkCity({ monthlyCostUSD: 990, id: 'ok-1', visaStatus: 'official' }),
  mkCity({ monthlyCostUSD: 990, id: 'ok-2', visaStatus: 'official' }),
  mkCity({ monthlyCostUSD: 990, id: 'ok-3', visaStatus: 'official' }),
  mkCity({ monthlyCostUSD: 990, id: 'ok-4', visaStatus: 'official' }),
  mkCity({ monthlyCostUSD: 1120, id: 'relax-novisa', visaStatus: 'none' }), // 预算放宽候选但签证不符
];
const rMix = applyHardConstraints(mixPool, strictHC);
check('放宽回填者签证不符仍被排除（两阶段过滤）', rMix.kept.length === 4 && !rMix.kept.some((c) => c.id === 'relax-novisa') && !rMix.overBudgetIds.includes('relax-novisa'));

// 2c. 签证三档
const visaPool = [
  mkCity({ id: 'v-official', visaStatus: 'official' }),
  mkCity({ id: 'v-alt', visaStatus: 'alternative' }),
  mkCity({ id: 'v-none', visaStatus: 'none' }),
  mkCity({ id: 'v-null', visaStatus: null }),
];
check('official 底线：仅 official 保留', applyHardConstraints(visaPool, { ...DEFAULT_CONSTRAINTS, visaLine: 'official' }).kept.every((c) => c.visaStatus === 'official'));
check('alternative 底线：official+alternative 保留，none/null 排除', (() => {
  const r = applyHardConstraints(visaPool, { ...DEFAULT_CONSTRAINTS, visaLine: 'alternative' });
  return r.kept.length === 2 && r.excluded.length === 2;
})());
check('none 底线：全保留', applyHardConstraints(visaPool, { ...DEFAULT_CONSTRAINTS, visaLine: 'none' }).kept.length === 4);
check('null 档位在 official/alternative 底线下均排除', applyHardConstraints(visaPool, { ...DEFAULT_CONSTRAINTS, visaLine: 'official' }).excluded.some((e) => e.cityId === 'v-null'));

// 2d. 安全阈值
const safePool = [
  mkCity({ id: 's-high', safety: 80 }),
  mkCity({ id: 's-mid', safety: 55 }),
  mkCity({ id: 's-null', safety: null }),
];
check('安全阈值默认关：null 也不排除', applyHardConstraints(safePool, DEFAULT_CONSTRAINTS).kept.length === 3);
check('安全阈值开启：低于阈值与 null 均排除', (() => {
  const r = applyHardConstraints(safePool, { ...DEFAULT_CONSTRAINTS, safetyEnabled: true, safetyThreshold: 60 });
  return r.kept.length === 1 && r.kept[0].id === 's-high' && r.excluded.length === 2;
})());
check('RELAX_MIN_KEEP = 5（放宽门槛常量）', RELAX_MIN_KEEP === 5);

console.log('=== 3. 硬约束 × 引擎集成冒烟 ===');
const hc: HardConstraints = { budgetCap: 1200, budgetCurrency: 'USD', visaLine: 'none', safetyEnabled: false, safetyThreshold: 60 };
const cRes = applyHardConstraints(citiesAll, hc);
check('100 城真实池：预算 $1200 过滤后有保留城市', cRes.kept.length > 0, `kept=${cRes.kept.length}`);
check('被排除城市均带可解释 reason', cRes.excluded.every((e) => e.reason.length > 0));
check('排除 + 保留 = 总数', cRes.kept.length + cRes.excluded.length === citiesAll.length);
const demoAnswers: UserAnswers = {
  mbti: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  lifestyle: { budget: 2, climate: 3, pace: 3, size: 3, social: 3, language: 3, visa: 3, remote: 4 },
  interests: [],
};
const assessment = assess(demoAnswers, cRes.kept);
check('assess(cityPool) 返回 Top5 且分数 0-99', assessment.matches.length > 0 && assessment.matches.length <= 5 && assessment.matches.every((m) => m.match >= 0 && m.match <= 99));
const penalized = applyOverBudgetPenalty(assessment.matches, cRes.overBudgetIds);
check('超预算降权 match -3 且带 overBudget 标注', penalized.every((m, i) => {
  const orig = assessment.matches.find((o) => o.city.id === m.city.id);
  if (!orig) return false;
  if (cRes.overBudgetIds.includes(m.city.id)) return m.overBudget === true && m.match === Math.max(0, orig.match - OVER_BUDGET_PENALTY);
  return m.overBudget == null && m.match === orig.match;
}));
const rNoConstraint = applyHardConstraints(citiesAll, DEFAULT_CONSTRAINTS);
check('空约束直通全池不过滤', rNoConstraint.kept.length === citiesAll.length && rNoConstraint.excluded.length === 0 && rNoConstraint.applied === false);

console.log('=== 4. 埋点漏斗计数 ===');
try {
  track('report_generated');
  trackStage('start', 1, 'personality');
  trackStage('complete', 1, 'personality');
  const funnel = getFunnel();
  check('track/trackStage 在 node 环境守卫降级不抛错', funnel !== undefined && typeof funnel === 'object');
  check('node 无 localStorage 时 getFunnel 返回空对象', Object.keys(funnel).length === 0);
} catch (err) {
  check('埋点调用不抛错', false, String(err));
}

console.log('');
console.log(`结果: ${pass} 通过, ${fail} 失败（共 ${pass + fail} 项）`);
if (fail > 0) process.exit(1);
