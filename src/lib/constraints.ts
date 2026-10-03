/**
 * constraints.ts — 第六轮：硬性条件过滤层（一票否决，引擎打分前跑，双版本通用）
 *
 * 三项硬约束（均可留空 = 不过滤）：
 *  a. 月预算上限（CNY/USD）：候选城市「月成本估算中值」超上限直接排除；
 *     若排除后剩余不足 5 城，放宽为「超上限但差距 < 15%」的降权保留（match -3）并标注「超预算」
 *  b. 签证底线：official（必须有官方数字游民签证）/ alternative（接受长期居留等替代路径）/ none（不限）
 *  c. 安全底线（默认关）：低于 Numbeo Safety 阈值的城市排除；指数缺失视作无法核验排除
 *
 * 过滤发生在加权打分之前，不影响引擎三大类权重与 11 维体系；
 * 所有的排除都带可解释 reason（报告页顶部展示）。
 */
import type { City } from '../data/types';

/** 人民币 → 美元近似汇率（仅用于预算上限换算，DATA.md 注明） */
export const CNY_USD_RATE = 7.2;
/** 超预算放宽带宽：超过上限但差距小于此比例时保留并降权 */
export const OVER_BUDGET_BAND = 0.15;
/** 放宽触发门槛：严格过滤后保留城市少于该数则启用放宽 */
export const RELAX_MIN_KEEP = 5;
/** 超预算放宽保留的分数惩罚（在 match 上扣减，最低 0） */
export const OVER_BUDGET_PENALTY = 3;

export type VisaLine = 'official' | 'alternative' | 'none';

export interface HardConstraints {
  /** 月预算上限数值；null = 不过滤 */
  budgetCap: number | null;
  budgetCurrency: 'USD' | 'CNY';
  /** 签证底线；'none' = 不限 */
  visaLine: VisaLine;
  /** 安全底线开关（默认关） */
  safetyEnabled: boolean;
  /** Numbeo Safety 指数下限（safetyEnabled 时生效） */
  safetyThreshold: number;
}

export const DEFAULT_CONSTRAINTS: HardConstraints = {
  budgetCap: null,
  budgetCurrency: 'CNY',
  visaLine: 'none',
  safetyEnabled: false,
  safetyThreshold: 60,
};

export interface ExcludedEntry {
  cityId: string;
  nameZh: string;
  countryZh: string;
  reason: string;
  /** 该城是否本可通过放宽保留（仅预算维度、差距 < 15%） */
  relaxable: boolean;
}

export interface ConstraintResult {
  /** 过滤（含放宽回填）后进入打分的城市 */
  kept: City[];
  /** 被排除城市与原因 */
  excluded: ExcludedEntry[];
  /** 触发放宽保留、需降权标注的超预算城市 id */
  overBudgetIds: string[];
  /** 是否触发了 <5 城放宽 */
  relaxed: boolean;
  /** 是否设置了任一硬约束 */
  applied: boolean;
}

export function hasAnyConstraint(hc: HardConstraints | null): boolean {
  if (!hc) return false;
  return hc.budgetCap != null || hc.visaLine !== 'none' || hc.safetyEnabled;
}

/** 预算上限换算为美元（CNY 按近似汇率折算） */
export function budgetCapUSD(hc: HardConstraints): number | null {
  if (hc.budgetCap == null) return null;
  return hc.budgetCurrency === 'CNY' ? Math.round(hc.budgetCap / CNY_USD_RATE) : Math.round(hc.budgetCap);
}

/**
 * 硬约束过滤：返回 kept（进入打分的城市）与 excluded（带可解释原因）。
 * 两阶段：先预算过滤，再对通过者跑签证/安全；预算排除后剩余不足 5 城时，
 * 把「超上限但差距 < 15%」的城市回填（回填者仍需通过签证/安全检查）并记入 overBudgetIds。
 */
export function applyHardConstraints(cities: City[], hc: HardConstraints | null): ConstraintResult {
  if (!hasAnyConstraint(hc) || hc == null) {
    return { kept: cities, excluded: [], overBudgetIds: [], relaxed: false, applied: false };
  }
  const cap = budgetCapUSD(hc);

  // 签证 + 安全检查（独立函数，预算通过者与放宽回填者共用，保证语义一致）
  const checkVisaSafety = (city: City): string | null => {
    if (hc.visaLine !== 'none') {
      if (city.visaStatus == null) {
        return hc.visaLine === 'official'
          ? '签证档位未核实，无法确认有官方数字游民签证'
          : '签证档位未核实，无法确认有官方签证或长期居留替代路径';
      }
      if (hc.visaLine === 'official' && city.visaStatus !== 'official') {
        return '无官方数字游民签证（与你设定的签证底线不符）';
      }
      if (hc.visaLine === 'alternative' && city.visaStatus !== 'official' && city.visaStatus !== 'alternative') {
        return '既无官方数字游民签证，也无长期居留替代路径记录';
      }
    }
    if (hc.safetyEnabled) {
      if (city.safety == null) {
        return `安全指数未核实，无法核验是否高于阈值 ${hc.safetyThreshold}`;
      }
      if (city.safety < hc.safetyThreshold) {
        return `安全指数 ${city.safety} 低于你设定的阈值 ${hc.safetyThreshold}`;
      }
    }
    return null;
  };

  const excluded: ExcludedEntry[] = [];
  const pushExcluded = (city: City, reason: string, relaxable: boolean): void => {
    excluded.push({ cityId: city.id, nameZh: city.nameZh, countryZh: city.countryZh, reason, relaxable });
  };

  // ---- 阶段 1：月预算上限 ----
  const passBudget: City[] = [];
  const budgetExcluded: Array<{ city: City; relaxable: boolean }> = [];
  for (const city of cities) {
    if (cap == null) {
      passBudget.push(city);
      continue;
    }
    if (city.monthlyCostUSD == null) {
      pushExcluded(city, `月成本估算缺失，无法核验是否在上限 $${cap.toLocaleString('en-US')} 之内`, false);
      continue;
    }
    if (city.monthlyCostUSD > cap) {
      const gap = (city.monthlyCostUSD - cap) / cap;
      pushExcluded(
        city,
        `月成本 ~$${city.monthlyCostUSD.toLocaleString('en-US')} 超出上限 $${cap.toLocaleString('en-US')}（超出 ${(gap * 100).toFixed(0)}%）`,
        gap < OVER_BUDGET_BAND,
      );
      budgetExcluded.push({ city, relaxable: gap < OVER_BUDGET_BAND });
      continue;
    }
    passBudget.push(city);
  }

  // ---- 阶段 2：签证 + 安全（只对预算通过者）----
  const kept: City[] = [];
  for (const city of passBudget) {
    const reason = checkVisaSafety(city);
    if (reason) pushExcluded(city, reason, false);
    else kept.push(city);
  }

  // ---- 放宽：预算排除后剩余不足 5 城 → 回填「超上限但差距 < 15%」的城（仍需过签证/安全）----
  const overBudgetIds: string[] = [];
  let relaxed = false;
  if (cap != null && kept.length < RELAX_MIN_KEEP) {
    const relaxable = budgetExcluded.filter((e) => e.relaxable);
    for (const { city } of relaxable) {
      const reason = checkVisaSafety(city);
      if (reason) {
        pushExcluded(city, reason, false);
        continue;
      }
      if (!relaxed) relaxed = true;
      kept.push(city);
      overBudgetIds.push(city.id);
    }
  }

  return { kept, excluded, overBudgetIds, relaxed, applied: true };
}

/** 对 assess 产出的 matches 应用超预算降权（match -3，最低 0），返回修改后的新数组 */
export function applyOverBudgetPenalty<T extends { city: City; match: number }>(
  matches: T[],
  overBudgetIds: string[],
): T[] {
  if (overBudgetIds.length === 0) return matches;
  const ids = new Set(overBudgetIds);
  return matches.map((m) => {
    if (!ids.has(m.city.id)) return m;
    return { ...m, match: Math.max(0, m.match - OVER_BUDGET_PENALTY), overBudget: true } as T;
  });
}
