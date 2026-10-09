/**
 * 第十一轮验证：引擎 v3 分层评分 + 空气质量 + 270 城扩容（verify-engine-v7）
 * 运行：pnpm tsx scripts/verify-engine-v7.ts
 */
import fs from 'node:fs';
import {
  TIER2_WEIGHTS,
  TIER3_WEIGHTS,
  TIER3_TOTAL_SHARE,
  PREFERENCE_WEIGHTS,
  PREFERENCE_SPLIT,
  PREFERENCE_KEYS,
  aggregateV3Raw,
  adventureFriendly,
  riskLinkFit,
  assess,
  computeCityFits,
  type City,
  type UserAnswers,
} from '../src/lib/engine';
import { COUNTRIES, getCountry } from '../src/data/countries';
import { NEUTRAL_ANSWERS } from '../src/lib/compare';
import { tagRepeats, riasecBoostedTags, deriveRisk } from '../src/lib/riasec';
import { riskQuestions } from '../src/data/riskTaking';
import { riasecQuestions } from '../src/data/riasec';
import { ipipQuestions } from '../src/data/questionsPro';

// 融合题库后，深化段由「是否作答 IPIP」派生（不再看 version 字段）
const IPIP_MID: Record<string, number> = Object.fromEntries(ipipQuestions.map((q) => [q.id, 3]));

let pass = 0;
let fail = 0;
const ok = (cond: unknown, label: string): void => {
  if (cond) {
    pass++;
    console.log(`OK   ${label}`);
  } else {
    fail++;
    console.log(`FAIL ${label}`);
  }
};
const approx = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) < eps;

// ---- 城市库加载 ----
const REGIONS = ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania'] as const;
const all: City[] = REGIONS.flatMap((r) => JSON.parse(fs.readFileSync(`src/data/cities/${r}.json`, 'utf8')) as City[]);
const byId = new Map(all.map((c) => [c.id, c]));

// =========================================================================
console.log('--- 第 1 节：270 城扩容 ---');
ok(all.length === 270, `城市库总数 270（实际 ${all.length}）`);
const byRegion: Record<string, number> = {};
for (const c of all) byRegion[c.region] = (byRegion[c.region] ?? 0) + 1;
console.log('   分布:', JSON.stringify(byRegion));
ok((byRegion.europe ?? 0) >= 60 && (byRegion.asia ?? 0) >= 55, '欧 ≥60 / 亚 ≥55');
ok((byRegion['north-america'] ?? 0) >= 20 && (byRegion['south-america'] ?? 0) >= 17, '北美 ≥20 / 南美 ≥17');
ok((byRegion.africa ?? 0) >= 17 && (byRegion.oceania ?? 0) >= 15, '非 ≥17 / 大洋 ≥15');
const countryCodes = new Set(all.map((c) => c.countryCode));
ok(countryCodes.size >= 60, `覆盖国家 ≥60（实际 ${countryCodes.size}）`);
// 国家库引用完整性：城市 countryCode 必须在国家库中
const noCountry = all.filter((c) => getCountry(c.countryCode) == null);
ok(noCountry.length === 0, `城市引用国家全部在 65 国库内（缺失 ${noCountry.length}）`);
// 旧城保护：字段值抽样不变（第四轮口径的 39 旧城 visaStatus 均为人工快照）
const oldCities = all.filter((c) => c.visaStatus != null);
ok(oldCities.length === 39, `39 旧城 visaStatus 快照保留（实际 ${oldCities.length}）`);
ok(oldCities.every((c) => c.traits != null), '39 旧城 traits 保留');
// 新城 schema 完整性：全部 270 城关键字段存在（值允许 null）
const schemaOk = all.every(
  (c) =>
    typeof c.id === 'string' &&
    typeof c.nameZh === 'string' &&
    typeof c.countryCode === 'string' &&
    'airQuality' in c &&
    'climateDetail' in c &&
    Array.isArray(c.tags),
);
ok(schemaOk, '270 城 schema 完整（id/nameZh/countryCode/airQuality/climateDetail/tags）');
const ids = new Set(all.map((c) => c.id));
ok(ids.size === 270, '城市 id 无重复');

// =========================================================================
console.log('--- 第 2 节：引擎 v3 权重表 ---');
const t2sum = TIER2_WEIGHTS.preference + TIER2_WEIGHTS.personality + TIER2_WEIGHTS.interest;
ok(approx(t2sum, 1 - TIER3_TOTAL_SHARE), `Tier2 权重合计 = 1 - 0.10（${t2sum.toFixed(2)}）`);
ok(TIER2_WEIGHTS.preference > TIER2_WEIGHTS.personality, '偏好 > 人格');
ok(TIER2_WEIGHTS.personality > TIER2_WEIGHTS.interest, '人格 > 兴趣');
const t3sum = TIER3_WEIGHTS.riasecBoost + TIER3_WEIGHTS.riskLink + TIER3_WEIGHTS.airFit;
ok(approx(t3sum, TIER3_TOTAL_SHARE) && TIER3_TOTAL_SHARE <= 0.1, `Tier3 合计（riasec+risk+air）${t3sum} = 上限 ${TIER3_TOTAL_SHARE} ≤ 10%`);
ok(TIER3_WEIGHTS.airFit < TIER3_WEIGHTS.riskLink && TIER3_WEIGHTS.riskLink < TIER3_WEIGHTS.riasecBoost, 'Tier3 内部权重：airFit < riskLink < riasecBoost');
const userSum = PREFERENCE_KEYS.filter((k) => !['climateComfort', 'englishDepth', 'safety'].includes(k)).reduce((s, k) => s + PREFERENCE_WEIGHTS[k], 0);
const objSum = ['climateComfort', 'englishDepth', 'safety'].reduce((s, k) => s + PREFERENCE_WEIGHTS[k], 0);
ok(approx(userSum, PREFERENCE_SPLIT.user) && approx(objSum, PREFERENCE_SPLIT.objective), `偏好内分层 0.86/0.14（实际 ${userSum.toFixed(2)}/${objSum.toFixed(2)}）`);

// aggregateV3Raw 单元语义
ok(aggregateV3Raw({ personalityFit: null, preferenceFit: null, interestFit: null }) === 0, '全 null → 0');
ok(aggregateV3Raw({ personalityFit: 100, preferenceFit: null, interestFit: null }) === 100, '单类存在 → 直接取该类（降权归一）');
// tier3 全缺 → = tier2
const t2only = aggregateV3Raw({ personalityFit: 80, preferenceFit: 60, interestFit: 40 });
const t2manual = (80 * 0.3 + 60 * 0.42 + 40 * 0.18) / 0.9;
ok(approx(t2only, t2manual, 1e-9), 'Tier3 全缺 → 纯 Tier2 加权');
// tier3 有值 → 0.9/0.1 混合
const withT3 = aggregateV3Raw({ personalityFit: 80, preferenceFit: 60, interestFit: 40, riasecFit: 50, riskFit: null });
const t3manual = ((50 * 0.06 + 0 * 0.04) / 0.06) * 0.1 + t2manual * 0.9;
ok(approx(withT3, t3manual, 1e-9), 'Tier3 单项存在 → 0.9/0.1 混合');
ok(withT3 > t2manual === (50 > t2manual), 'Tier3 加分方向正确（高于 Tier2 均值则拉高）');

// =========================================================================
console.log('--- 第 3 节：Tier 3 派生（冒险友好度 / 风险联动 / RIASEC 迁移） ---');
// adventureFriendly 手工算例：safety 80 ×0.4 + visaScore 5→100 ×0.3 + nightlife 100 ×0.2 + outdoor 命中 1/5=20 ×0.1
const mockCity = {
  safety: 80,
  visaScore: 5,
  digitalNomadVisa: null,
  tags: ['nightlife', 'outdoor', 'food', 'history', 'arts'],
} as unknown as City;
const afManual = (80 * 0.4 + 100 * 0.3 + 100 * 0.2 + 20 * 0.1) / (0.4 + 0.3 + 0.2 + 0.1);
ok(approx(adventureFriendly(mockCity) ?? -1, afManual, 1e-9), `adventureFriendly 加权算例（${afManual}）`);
// null 分量剔除重归一：nightlife 100×0.2 + outdoor 0×0.1，除以 0.3
const mockCity2 = { safety: null, visaScore: null, digitalNomadVisa: null, tags: ['nightlife'] } as unknown as City;
ok(approx(adventureFriendly(mockCity2) ?? -1, 200 / 3, 1e-9), `仅夜生活标签 → 200/3≈66.7（outdoor 0 分仍计入）（实际 ${adventureFriendly(mockCity2)}）`);
ok(adventureFriendly({ safety: null, visaScore: null, digitalNomadVisa: null, tags: [] } as unknown as City) === null, '全 null → null');
// riskLinkFit 距离语义：按 keyed 构造满分答案（rk1-6 正向填 5，rk7-10 反向填 1）
const riskAnswers: Record<string, number> = {};
for (const q of riskQuestions) riskAnswers[q.id] = q.keyed === 1 ? 5 : 1;
const rp = deriveRisk(riskAnswers);
ok(rp != null && rp.score === 100, `keyed 满分风险答案 → 指数 100（${rp?.score}）`);
const riskA = { risk: riskAnswers } as unknown as UserAnswers;
ok(riskLinkFit(mockCity, riskA) != null, 'riskLinkFit 有值（双信号齐）');
const af = adventureFriendly(mockCity) as number;
ok(approx((riskLinkFit(mockCity, riskA) ?? -1), 100 - Math.abs(100 - af), 1e-9), 'riskLinkFit = 100 - |risk - af|');
ok(riskLinkFit(mockCity, {} as UserAnswers) === null, '无风险答案 → null');
ok(riskLinkFit({ safety: null, visaScore: null, digitalNomadVisa: null, tags: [] } as unknown as City, riskA) === null, '城市侧全 null → null');

// RIASEC 迁移：interestFit 与 riasec 答案解耦
const proBase: UserAnswers = {
  ...(NEUTRAL_ANSWERS as unknown as UserAnswers),
  ipip: IPIP_MID,
  interests: ['nature', 'food', 'coffee'],
  interestSubs: undefined,
} as UserAnswers;
const cityWithBoost = mockCity; // tags 与 RIASEC 强化集有交集（outdoor/food/nightlife）
const fitsNoRiasec = computeCityFits(cityWithBoost, proBase);
const withRiasecAnswers = { ...proBase, riasec: Object.fromEntries(riasecQuestions.map((q) => [q.id, 5])) } as UserAnswers;
const fitsWithRiasec = computeCityFits(cityWithBoost, withRiasecAnswers);
ok(fitsNoRiasec.interestFit === fitsWithRiasec.interestFit, '兴趣类本体分不含 RIASEC 强化（迁出解耦）');
ok((fitsWithRiasec.riasecFit ?? -1) > 0, `RIASEC 强化标签命中城市 tags → riasecFit > 0（${(fitsWithRiasec.riasecFit ?? -1).toFixed(1)}）`);
const liteFits = computeCityFits(cityWithBoost, { ...(NEUTRAL_ANSWERS as unknown as UserAnswers), version: 'lite' });
ok(liteFits.riasecFit == null && liteFits.riskFit == null, 'lite 版 Tier3 两分均为 null');
// riasecBoostedTags：只强化已勾选标签
const boosted = riasecBoostedTags(withRiasecAnswers);
ok([...boosted.keys()].every((t) => (withRiasecAnswers.interests as string[]).includes(t)), 'RIASEC 强化只作用于已勾选标签');
// airFit：WHO 分档映射（标准版专属；null 数据 → null）
const airCases: [string, number][] = [['good', 90], ['fair', 72], ['moderate', 48], ['poor', 25]];
for (const [band, expect] of airCases) {
  const c = { airQuality: { pm25: 8, band, period: 't' }, tags: [] } as unknown as City;
  ok(computeCityFits(c, withRiasecAnswers).airFit === expect, `airFit ${band} → ${expect}`);
}
ok(computeCityFits({ airQuality: null, tags: [] } as unknown as City, withRiasecAnswers).airFit == null, 'airQuality null → airFit null');
ok(computeCityFits(airCases[0][0] === 'good' ? ({ airQuality: { pm25: 8, band: 'good', period: 't' }, tags: [] } as unknown as City) : mockCity, { ...(NEUTRAL_ANSWERS as unknown as UserAnswers), version: 'lite' }).airFit == null, 'lite 版 airFit = null（Tier3 标准版专属）');
// tagRepeats 参数化：全信号 ≥ 基线
const base = tagRepeats(withRiasecAnswers);
const withR = tagRepeats(withRiasecAnswers, { includeRiasec: true });
ok(withR.size >= base.size, 'tagRepeats 全信号 ≥ 基线（参数化兼容）');

// =========================================================================
console.log('--- 第 4 节：双版本 assess 回归（270 城） ---');
// lite：tier3 无信号
const liteResult = assess(NEUTRAL_ANSWERS as unknown as UserAnswers, all);
ok(liteResult.matches.every((m) => m.match >= 0 && m.match <= 99), `lite 匹配分值域 0-99（Top1 ${liteResult.matches[0]?.match}）`);
ok(liteResult.matches.every((m) => m.tier3Fit == null), 'lite 全部 tier3Fit = null');
ok(liteResult.matches[0].city.id.length > 0, 'lite Top1 有效');
// pro：tier3 有信号
const proAnswers: UserAnswers = {
  ...(withRiasecAnswers as UserAnswers),
  lifestyle: withRiasecAnswers.lifestyle,
  risk: Object.fromEntries(riskQuestions.map((q) => [q.id, q.keyed === 1 ? 4 : 2])),
} as UserAnswers;
const proResult = assess(proAnswers, all);
ok(proResult.matches.every((m) => m.match >= 0 && m.match <= 99), `pro 匹配分值域 0-99（Top1 ${proResult.matches[0]?.match}）`);
ok(proResult.matches.every((m) => (m.tier3Fit ?? 0) > 0 || m.tier3Fit == null), 'pro tier3Fit 合法（>0 或 null）');
ok(proResult.riasecProfile != null && proResult.riskProfile != null, 'pro 附带 RIASEC / 风险画像');
// 降权语义：新城 traits null → 人格类剔除，分数仍产出
const newCity = all.find((c) => c.traits == null && c.livingScore != null);
ok(newCity != null && computeCityFits(newCity, NEUTRAL_ANSWERS as unknown as UserAnswers).personalityFit === null, '新城 traits null → 人格类 null 降权');
// 硬约束兼容：visaFree + CN 过滤后 assess 正常
const kept = all.filter((c) => {
  const vp = getCountry(c.countryCode)?.visaPassport;
  return vp != null && (vp.entry === 'visaFree' || vp.entry === 'visaOnArrival');
});
ok(kept.length >= 15, `CN+visaFree 可保留城市 ≥15（${kept.length}）`);

// =========================================================================
console.log('--- 第 5 节：空气质量字段 ---');
const withAir = all.filter((c) => c.airQuality != null);
console.log(`   覆盖: ${withAir.length}/${all.length}`);
const bands = new Set(withAir.map((c) => c.airQuality!.band));
ok(bands.size >= 2 && [...bands].every((b) => ['good', 'fair', 'moderate', 'poor'].includes(b)), `WHO 分档合法（${[...bands].join(',')}）`);
ok(withAir.every((c) => c.airQuality!.pm25 >= 0 && c.airQuality!.pm25 <= 200), 'PM2.5 值域合理（0-200）');
ok(withAir.every((c) => c.airQuality!.period === '2022-08 ~ 2024-12'), '快照期标注一致');
// 分档与数值自洽
const bandOk = withAir.every((c) => {
  const v = c.airQuality!.pm25;
  const b = c.airQuality!.band;
  return b === (v <= 10 ? 'good' : v <= 15 ? 'fair' : v <= 25 ? 'moderate' : 'poor');
});
ok(bandOk, '分档与 PM2.5 数值自洽');
if (withAir.length < all.length) {
  console.log(`   注意：${all.length - withAir.length} 城待空气管道补齐（幂等重跑 snapshot-airquality.mjs）`);
}

// =========================================================================
console.log('--- 第 6 节：i18n 键完整性（v3 相关） ---');
import { DICTS } from '../src/i18n/dict';
for (const lang of ['zh', 'en'] as const) {
  const d = DICTS[lang];
  const need = ['air.title', 'air.band.good', 'air.band.poor', 'air.nodata', 'cmp.weights.note', 'wd.note', 'cn.rule'];
  const missing = need.filter((k) => typeof d[k] !== 'string' || d[k].length === 0);
  ok(missing.length === 0, `${lang} 词典 v3/空气键齐全${missing.length ? `（缺 ${missing.join(',')}）` : ''}`);
}
ok(COUNTRIES.length === 65, `国家库 65 国（${COUNTRIES.length}）`);

console.log(`\n=== ${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail > 0 ? 1 : 0);
