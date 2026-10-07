/**
 * verify-passport-v6.ts — 第九轮验证脚本（护照维度 + 签证匹配升级 + 长期定居模块）
 *
 * 覆盖：
 *  1. 护照枚举与默认值：PASSPORT_OPTIONS 12 项顺序 / DEFAULT_CONSTRAINTS.passport = 'CN'
 *     / loadPassport 在 node 环境守卫返回 'CN'
 *  2. 65 国快照覆盖率：visaPassport 65/65 + longStay 65/65；entry / work / digitalNomad /
 *     longTerm / socialSecurityCn 枚举合法；taxResidencyDays null 或 30-365；
 *     snapshotDate 与逐字段 sources 标注
 *  3. 免签底线过滤联动单测（真实 100 城池）：
 *     CN + visaFree → 按快照过滤（免签/落地签保留，eVisa/需签排除，无快照排除）；
 *     US + visaFree → passportSkipped 降级全保留；CN + visaFree 保留数 = visaFree + visaOnArrival 国家城市数；
 *     两阶段（预算 → 签证）顺序不回归
 *  4. 引擎集成冒烟：visaFree 过滤后 assess 正常出 Top5；computeCityFits 不受 passport 影响
 *  5. 双语键完整：passport.* / cons.visa.quick.* / pv.* / longstay.* / cmp.taxDays /
 *     cn.passportSkipped / cons.budget.placeholder 在 zh+en 都存在；
 *     hc.visafree.* zh 值与 constraints.ts reason 串完全一致（REVERSE_ZH 反查前提）
 *  6. REVERSE_ZH 反查命中：两个新 reason 串 en 反查非恒等
 *
 * 运行：pnpm tsx scripts/verify-passport-v6.ts
 */
import { cities as citiesAll } from '../src/data';
import rawCountries from '../src/data/countries.json';
import type { Country } from '../src/data/types';
import {
  applyHardConstraints,
  DEFAULT_CONSTRAINTS,
  isVisaFreeFriendly,
  VISA_LINE_ORDER,
  type HardConstraints,
} from '../src/lib/constraints';
import { assess, computeCityFits } from '../src/lib/engine';
import { loadPassport } from '../src/lib/storage';
import { DICTS } from '../src/i18n/dict';
import { PASSPORT_OPTIONS } from '../src/components/quiz/ConstraintsStep';

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

console.log('=== 1. 护照枚举与默认值 ===');
check(
  'PASSPORT_OPTIONS 12 项且顺序正确',
  PASSPORT_OPTIONS.length === 12 &&
    PASSPORT_OPTIONS.join(',') === ['CN', 'HK', 'MO', 'TW', 'SG', 'JP', 'US', 'GB', 'CA', 'AU', 'EU', 'OTHER'].join(','),
  PASSPORT_OPTIONS.join(','),
);
check('DEFAULT_CONSTRAINTS.passport = CN', DEFAULT_CONSTRAINTS.passport === 'CN');
check('loadPassport node 守卫返回 CN', loadPassport() === 'CN');
check('VISA_LINE_ORDER 含 visaFree 首档', VISA_LINE_ORDER[0] === 'visaFree' && VISA_LINE_ORDER.length === 4);
check('isVisaFreeFriendly：免签/落地签 true，eVisa/需签 false', isVisaFreeFriendly('visaFree') && isVisaFreeFriendly('visaOnArrival') && !isVisaFreeFriendly('eVisa') && !isVisaFreeFriendly('visaRequired'));

console.log('=== 2. 65 国快照覆盖率与枚举 ===');
const ENTRY_KEYS = ['visaFree', 'visaOnArrival', 'eVisa', 'visaRequired'] as const;
const LEVEL_KEYS = ['friendly', 'restricted', 'unknown'] as const;
const SS_KEYS = ['treaty', 'none', 'negotiating'] as const;
const vpCount = COUNTRIES.filter((c) => c.visaPassport != null).length;
const lsCount = COUNTRIES.filter((c) => c.longStay != null).length;
check(`visaPassport 覆盖 ${vpCount}/${COUNTRIES.length}`, vpCount === COUNTRIES.length);
check(`longStay 覆盖 ${lsCount}/${COUNTRIES.length}`, lsCount === COUNTRIES.length);
check(
  'entry 枚举合法',
  COUNTRIES.every((c) => ENTRY_KEYS.includes((c.visaPassport as NonNullable<Country['visaPassport']>).entry as (typeof ENTRY_KEYS)[number])),
);
check(
  'work / digitalNomad / longTerm 枚举合法',
  COUNTRIES.every((c) => {
    const s = c.visaPassport as NonNullable<Country['visaPassport']>;
    return LEVEL_KEYS.includes(s.work as (typeof LEVEL_KEYS)[number]) && LEVEL_KEYS.includes(s.digitalNomad as (typeof LEVEL_KEYS)[number]) && LEVEL_KEYS.includes(s.longTerm as (typeof LEVEL_KEYS)[number]);
  }),
);
check(
  'taxResidencyDays null 或 30-365',
  COUNTRIES.every((c) => {
    const d = (c.longStay as NonNullable<Country['longStay']>).taxResidencyDays;
    return d == null || (d >= 30 && d <= 365);
  }),
);
check(
  'socialSecurityCn 枚举（含 null）',
  COUNTRIES.every((c) => {
    const v = (c.longStay as NonNullable<Country['longStay']>).socialSecurityCn;
    return v == null || SS_KEYS.includes(v as (typeof SS_KEYS)[number]);
  }),
);
check(
  'rentalCustom string 或 null（不编造 → 允许空）',
  COUNTRIES.every((c) => {
    const v = (c.longStay as NonNullable<Country['longStay']>).rentalCustom;
    return v == null || typeof v === 'string';
  }),
);
check(
  'snapshotDate 存在（visaPassport + longStay）',
  COUNTRIES.every((c) => {
    const s = c.visaPassport as NonNullable<Country['visaPassport']> | null;
    const l = c.longStay as NonNullable<Country['longStay']> | null;
    return (s != null && typeof s.snapshotDate === 'string' && s.snapshotDate.length >= 8) && (l != null && typeof l.snapshotDate === 'string');
  }),
);
check(
  'sources 逐字段标注（visaPassport / longStay）',
  COUNTRIES.every((c) => {
    const s = c.sources as Record<string, unknown> | undefined;
    return s != null && typeof s.visaPassport === 'string' && s.visaPassport.length > 0 && typeof s.longStay === 'string' && s.longStay.length > 0;
  }),
);
const treatyCount = COUNTRIES.filter((c) => c.longStay?.socialSecurityCn === 'treaty').length;
// 人社部生效名单 12 国；FR 不在本项目 65 国库（无法国城市）→ 库内应为 11 国
check(`社保协定国标注合理（treaty 11 国，实际 ${treatyCount}）`, treatyCount === 11);
const freeCount = COUNTRIES.filter((c) => c.visaPassport?.entry === 'visaFree').length;
const voaCount = COUNTRIES.filter((c) => c.visaPassport?.entry === 'visaOnArrival').length;
console.log(`    [info] 免签 ${freeCount} 国 · 落地签 ${voaCount} 国 · 其余 eVisa/需签`);
check('免签 + 落地签国家数在 10-25 区间（快照口径自检）', freeCount + voaCount >= 10 && freeCount + voaCount <= 25);

console.log('=== 3. 免签底线过滤联动（真实 100 城池） ===');
const cnVisaFree: HardConstraints = { ...DEFAULT_CONSTRAINTS, visaLine: 'visaFree', passport: 'CN' };
const rCN = applyHardConstraints(citiesAll, cnVisaFree);
check('CN + visaFree：applied 且 passportSkipped = false', rCN.applied && rCN.passportSkipped === false);
check('CN + visaFree：全部排除项都带可解释 reason', rCN.excluded.every((e) => typeof e.reason === 'string' && e.reason.length > 0));
check(
  '排除原因只含免签档两类串',
  rCN.excluded.every((e) => e.reason === '该国家暂无护照免签快照，无法核验入境待遇' || e.reason === '持当前护照入境需提前办签或电子签，不满足免签/落地签优先'),
  [...new Set(rCN.excluded.map((e) => e.reason))].join(' | '),
);

// 保留数校验：按快照独立重算
const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));
const expectedKept = citiesAll.filter((c) => {
  const snap = byCode.get(c.countryCode as string)?.visaPassport ?? null;
  return snap != null && isVisaFreeFriendly(snap.entry);
}).length;
check(`CN + visaFree 保留 ${rCN.kept.length} 城 = 快照独立重算 ${expectedKept}`, rCN.kept.length === expectedKept);
check(`保留数 ${rCN.kept.length} 在合理区间（≥5 保底放宽；< 200 全量，过滤有效）`, rCN.kept.length >= 5 && rCN.kept.length < citiesAll.length);

const usVisaFree: HardConstraints = { ...DEFAULT_CONSTRAINTS, visaLine: 'visaFree', passport: 'US' };
const rUS = applyHardConstraints(citiesAll, usVisaFree);
check('US + visaFree：passportSkipped = true（降级不过滤）', rUS.passportSkipped === true);
check('US + visaFree：100 城全保留且无排除项', rUS.kept.length === citiesAll.length && rUS.excluded.length === 0);

const cnNone: HardConstraints = { ...DEFAULT_CONSTRAINTS, visaLine: 'none', passport: 'CN' };
check('visaLine none：不触发 visaFree 逻辑', applyHardConstraints(citiesAll, cnNone).excluded.length === 0);

// 两阶段：预算 + 免签组合，预算排除者不重复出现在免签排除中
const combo: HardConstraints = { ...DEFAULT_CONSTRAINTS, budgetCap: 800, budgetCurrency: 'USD', visaLine: 'visaFree', passport: 'CN' };
const rCombo = applyHardConstraints(citiesAll, combo);
check(
  '两阶段：预算 + 免签组合排除项无重复城市',
  new Set(rCombo.excluded.map((e) => e.cityId)).size === rCombo.excluded.length,
);

console.log('=== 4. 引擎集成冒烟 ===');
// 与 verify-country-v3 同构的中性答案（mbti 数组 + 数字序数 lifestyle），附加 passport 字段
const baseAnswers = {
  mbti: Array.from({ length: 32 }, () => 3),
  lifestyle: { budget: 2, climate: 3, pace: 3, size: 3, social: 3, language: 3, visa: 3, remote: 4 },
  interests: [],
};
const answers = { ...baseAnswers, passport: 'CN' as const };
const assessed = assess(answers, citiesAll);
check('assess 正常出 Top5（passport 字段不干扰引擎）', assessed.matches.length === 5);
const fitsA = computeCityFits(citiesAll[0], answers);
const fitsB = computeCityFits(citiesAll[0], { ...answers, passport: 'US' });
check('computeCityFits 不受 passport 影响', JSON.stringify(fitsA) === JSON.stringify(fitsB));
const assessedFiltered = assess(answers, rCN.kept);
check('visaFree 过滤后的城池 assess 正常', assessedFiltered.matches.length === Math.min(5, rCN.kept.length));

console.log('=== 5. 双语键完整性 ===');
const uiZh = DICTS.zh as unknown as Record<string, string>;
const uiEn = DICTS.en as unknown as Record<string, string>;
const anZh = DICTS.zh as unknown as Record<string, string>;
const anEn = DICTS.en as unknown as Record<string, string>;

const passportKeys = ['label', 'hintCn', 'hintOther', ...PASSPORT_OPTIONS.map((c) => c)];
check(
  'passport.* 15 键 zh+en 齐全',
  passportKeys.every((k) => uiZh[`passport.${k}`]?.length > 0 && uiEn[`passport.${k}`]?.length > 0),
);
check('cons.visa.quick.* zh+en', ['cons.visa.quick.visaFree', 'cons.visa.quick.official', 'cons.visa.quick.alternative', 'cons.visa.quick.none'].every((k) => uiZh[k]?.length > 0 && uiEn[k]?.length > 0));
const pvKeys = ['title', 'entry.visaFree', 'entry.visaOnArrival', 'entry.eVisa', 'entry.visaRequired', 'work', 'digitalNomad', 'longTerm', 'level.friendly', 'level.restricted', 'level.unknown', 'disclaimer', 'snapshot', 'fallback'];
check('pv.* 14 键 zh+en 齐全', pvKeys.every((k) => uiZh[`pv.${k}`]?.length > 0 && uiEn[`pv.${k}`]?.length > 0));
const lsKeys = ['title', 'taxDaysLabel', 'taxDays', 'ssLabel', 'ss.treaty', 'ss.none', 'ss.negotiating', 'rentalLabel', 'verify', 'none'];
check('longstay.* 10 键 zh+en 齐全', lsKeys.every((k) => uiZh[`longstay.${k}`]?.length > 0 && uiEn[`longstay.${k}`]?.length > 0));
check('cmp.taxDays / cn.passportSkipped / cons.budget.placeholder zh+en', ['cmp.taxDays', 'cn.passportSkipped', 'cons.budget.placeholder'].every((k) => uiZh[k]?.length > 0 && uiEn[k]?.length > 0));
check('插值占位 {days} / {date} 保留', uiZh['longstay.taxDays'].includes('{days}') && uiEn['longstay.taxDays'].includes('{days}') && uiZh['pv.snapshot'].includes('{date}') && uiEn['pv.snapshot'].includes('{date}'));

console.log('=== 6. reason 串与词典一致（REVERSE_ZH 反查前提） ===');
check('hc.visafree.nosnap zh 值与 constraints 串一致', anZh['hc.visafree.nosnap'] === '该国家暂无护照免签快照，无法核验入境待遇');
check('hc.visafree.mismatch zh 值与 constraints 串一致', anZh['hc.visafree.mismatch'] === '持当前护照入境需提前办签或电子签，不满足免签/落地签优先');
check('hc.visafree.* en 值非中文', anEn['hc.visafree.nosnap'].length > 0 && !/[\u4e00-\u9fff]/.test(anEn['hc.visafree.nosnap']) && anEn['hc.visafree.mismatch'].length > 0 && !/[\u4e00-\u9fff]/.test(anEn['hc.visafree.mismatch']));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
