/**
 * tax.ts — 税负测算的纯逻辑层（V2：多国累进税率沙盒）
 *
 * 设计原则（对应网站实际情况与用户要求）：
 * - 个税制在「国家」层级，规则以 countryCode 索引（见 data/taxRules.ts）；城市经 countryCode 解析；
 * - V2 在 V1「规则字典查表」之上叠加「分级税率引擎」：对已录入数据源的国家（data/taxBrackets.ts），
 *   按其本币累进级距、起征点与特惠税制，用纯函数逐档累加计算出精确的税额与有效税率；
 * - 未录入分级数据的国家，回落 V1 粗颗粒口径（exempt/territorial/concession/standard）；
 * - 不依赖任何第三方付费 API：全部为确定性纯函数，可在前端或 Cloudflare Workers 直接运行；
 * - 币种换算仅为展示口径：本地所得税额按快照汇率折美元后与输入的年收入（USD）比较。
 *
 * 免责：方向性估算，不构成税务建议；实际税负受居留身份、抵扣、协定、社保与申报义务影响。
 */
import type { City } from '../data/types';
import { getCountry } from '../data/countries';
import {
  taxRuleForCountry,
  effectiveRatePct,
  TAX_BASELINE_EFF_RATE,
  type IncomeNature,
  type TaxRule,
} from '../data/taxRules';
import {
  taxProfileForCountry,
  thresholdLocal,
  type Bracket,
  type CountryTaxProfile,
  type SpecialRegime,
} from '../data/taxBrackets';

export type { IncomeNature, TaxRegimeType } from '../data/taxRules';
export type { Bracket, CountryTaxProfile, SpecialRegime } from '../data/taxBrackets';

/** 单档累进明细（供 UI 展示逐档税额） */
export interface BracketBreakdown {
  from: number;
  to: number | null;
  ratePct: number;
  /** 该档内的应纳税所得（本币） */
  taxableLocal: number;
  /** 该档税额（本币） */
  taxLocal: number;
}

export interface TaxEstimate {
  /** 城市与国家（用于展示） */
  city: City;
  rule: TaxRule | null;
  /** 该国最高边际个税率（%，事实参考；无来源 null） */
  topRatePct: number | null;
  /** 税务居民认定天数（天/年；无来源 null） */
  residencyDays: number | null;
  /** 近似综合有效税率（%） */
  effRate: number;
  /** 预计本地净收入（USD/年） */
  netUSD: number;
  /** 相较欧美高税区基线多留存的金额（USD/年；可为负） */
  savedVsBaselineUSD: number;
  /** === V2 分级税率引擎（仅当录入分级数据时非空） === */
  profile?: CountryTaxProfile | null;
  /** 是否走了分级引擎（true）还是 V1 粗颗粒兜底（false） */
  bracketBased: boolean;
  /** 该国的币种与换算口径（本币代码；无分级数据时 null） */
  currency: string | null;
  /** 本地起征点/标准扣除（本币；无分级数据时 null） */
  thresholdLocalAmount: number | null;
  /** 本地应纳税所得（本币；无分级数据时 null） */
  taxableLocal: number | null;
  /** 本地所得税额（本币；无分级数据时 null） */
  taxLocal: number | null;
  /** 逐档累进明细（无分级数据时为空数组） */
  breakdown: BracketBreakdown[];
  /** 命中的特惠税制（null 表示未启用或该国无） */
  special: SpecialRegime | null;
}

/** 城市 → 税制规则（V1 粗颗粒；未收录国家返回 null） */
export function taxRuleForCity(city: City): TaxRule | null {
  return taxRuleForCountry(city.countryCode);
}

/** 城市 → 分级税率档案（V2；未录入返回 null） */
export function taxProfileForCity(city: City): CountryTaxProfile | null {
  return taxProfileForCountry(city.countryCode);
}

/** 各国最高边际税率（从国家库取，供估算与展示） */
export function topRateForCity(city: City): number | null {
  return getCountry(city.countryCode)?.taxTopRatePct ?? null;
}

export function residencyDaysForCity(city: City): number | null {
  return getCountry(city.countryCode)?.longStay?.taxResidencyDays ?? null;
}

/** 取适用于给定收入性质的特惠税制（无适用项返回 null） */
export function applicableRegime(profile: CountryTaxProfile, nature: IncomeNature): SpecialRegime | null {
  return profile.regimes.find((r) => !r.natures || r.natures.includes(nature)) ?? null;
}

/**
 * 逐档累加计算本地税额（纯函数核心）。
 * - taxable 为「已扣除起征点后」的本地应纳税所得；
 * - 返回合计税额（本币）与逐档明细。
 */
export function progressiveTax(taxable: number, brackets: Bracket[]): { tax: number; breakdown: BracketBreakdown[] } {
  const breakdown: BracketBreakdown[] = [];
  let tax = 0;
  let lower = 0;
  for (const band of brackets) {
    if (taxable <= lower) break;
    const upper = band.upTo ?? Infinity;
    const slice = Math.min(taxable, upper) - lower;
    if (slice <= 0) {
      lower = upper;
      continue;
    }
    const sliceTax = slice * (band.ratePct / 100);
    tax += sliceTax;
    breakdown.push({ from: lower, to: band.upTo, ratePct: band.ratePct, taxableLocal: slice, taxLocal: sliceTax });
    lower = upper;
  }
  return { tax, breakdown };
}

/**
 * 特惠税制下的本地税额。
 * - exempt：全额免税 → 0；
 * - relief：标准累进税额 × (1 − 减免比例)；
 * - flat：优惠上限内按统一税率，超出部分回归标准最高档（capLocal 为 null 时全额统一税率）。
 */
function specialTaxOf(special: SpecialRegime, taxable: number, brackets: Bracket[]): { tax: number; breakdown: BracketBreakdown[] } {
  if (special.kind === 'exempt' || taxable <= 0) return { tax: 0, breakdown: [] };
  if (special.kind === 'relief') {
    const std = progressiveTax(taxable, brackets);
    const relief = special.ratePct ?? 0;
    return {
      tax: std.tax * (1 - relief / 100),
      breakdown: std.breakdown.map((x) => ({ ...x, taxLocal: x.taxLocal * (1 - relief / 100) })),
    };
  }
  // flat
  const flatRate = (special.ratePct ?? 0) / 100;
  const rated = special.capLocal ?? taxable;
  const within = Math.min(taxable, rated);
  const excess = Math.max(0, taxable - (special.capLocal ?? taxable));
  const topRate = (brackets[brackets.length - 1]?.ratePct ?? 0) / 100;
  const tax = within * flatRate + excess * topRate;
  const breakdown: BracketBreakdown[] = [{ from: 0, to: special.capLocal, ratePct: special.ratePct ?? 0, taxableLocal: within, taxLocal: within * flatRate }];
  if (excess > 0) breakdown.push({ from: special.capLocal ?? 0, to: null, ratePct: topRate * 100, taxableLocal: excess, taxLocal: excess * topRate });
  return { tax, breakdown };
}

export interface EstimateOptions {
  /** 是否应用特惠税制（默认 true）；关闭时按常规分级税率计算 */
  applySpecial?: boolean;
}

/**
 * 计算某城市在给定年收入与收入性质下的税负估算。
 *
 * 优先走 V2 分级引擎：
 *   应纳税所得（本币） = max(0, 年收入 USD / usdRate − 起征点)
 *   本地税额 = 特惠税制（若命中且启用）否则逐档累加
 *   有效税率 = 税额（折美元）/ 年收入 USD
 * 若该国未录入分级数据，则回落 V1 粗颗粒有效税率（treat as flat）。
 *
 * 基线：欧美高税区参考有效税率 40%（TAX_BASELINE_EFF_RATE），用于「多留存」对比。
 */
export function estimateTax(city: City, grossUSD: number, nature: IncomeNature, opts: EstimateOptions = {}): TaxEstimate {
  const rule = taxRuleForCity(city);
  const profile = taxProfileForCity(city);
  const topRatePct = topRateForCity(city);
  const residencyDays = residencyDaysForCity(city);
  const gross = Math.max(0, Math.round(grossUSD));
  const baselineNet = Math.round(gross * (1 - TAX_BASELINE_EFF_RATE / 100));

  let effRate: number;
  let netUSD: number;
  let special: SpecialRegime | null = null;
  let taxableLocal: number | null = null;
  let taxLocal: number | null = null;
  let breakdown: BracketBreakdown[] = [];
  let thresholdVal: number | null = null;

  if (profile) {
    const rate = profile.usdRate || 1;
    const localGross = gross / rate;
    thresholdVal = thresholdLocal(profile);
    taxableLocal = Math.max(0, localGross - thresholdVal);
    special = opts.applySpecial === false ? null : applicableRegime(profile, nature);
    const computed = special ? specialTaxOf(special, taxableLocal, profile.brackets) : progressiveTax(taxableLocal, profile.brackets);
    taxLocal = computed.tax;
    breakdown = computed.breakdown;
    const taxUSD = taxLocal * rate;
    effRate = gross > 0 ? Math.round((taxUSD / gross) * 1000) / 10 : 0;
    netUSD = Math.round(gross - taxUSD);
  } else {
    effRate = rule ? effectiveRatePct(rule, nature, topRatePct) : 22;
    netUSD = Math.round(gross * (1 - effRate / 100));
  }

  return {
    city,
    rule,
    topRatePct,
    residencyDays,
    effRate,
    netUSD,
    savedVsBaselineUSD: netUSD - baselineNet,
    profile,
    bracketBased: !!profile,
    currency: profile?.currency ?? null,
    thresholdLocalAmount: thresholdVal,
    taxableLocal,
    taxLocal,
    breakdown,
    special,
  };
}

/** 报告卡片用的紧凑税负标签文案参数（区分是否有规则、有效税率、是否属地/免税） */
export interface TaxChipSummary {
  rule: TaxRule | null;
  /** 有效税率（%；rule 为 null 时按标准型近似） */
  effRate: number;
  /** 是否属于「境外收入暂免」口径（exempt/territorial → 有效税率 0） */
  foreignExempt: boolean;
  /** 是否有专项优惠制度 */
  concession: boolean;
}

// 报告卡片只需「典型年收入」下的方向性有效税率，采用与子页面一致的示例口径。
const CHIP_REF_INCOME = 50000;

export function taxChipSummary(city: City, nature: IncomeNature = 'employee'): TaxChipSummary {
  const rule = taxRuleForCity(city);
  const profile = taxProfileForCity(city);
  let effRate: number;
  if (profile) {
    effRate = estimateTax(city, CHIP_REF_INCOME, nature).effRate;
  } else {
    effRate = rule ? effectiveRatePct(rule, nature, topRateForCity(city)) : 22;
  }
  return {
    rule,
    effRate,
    foreignExempt: rule != null && (rule.type === 'exempt' || rule.type === 'territorial'),
    concession: rule?.type === 'concession',
  };
}
