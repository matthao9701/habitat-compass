// 城市对比页计算层：临时权重重算 + 成本对比结论模板
// 注意：这里的重算只作用于对比页展示，不回写引擎与报告。
import { PREFERENCE_DIMENSIONS } from './analysis';
import {
  aggregateV3Raw,
  computeCityFits,
  PREFERENCE_WEIGHTS,
  TIER3_WEIGHTS,
  type UserAnswers,
} from './engine';
import type { City } from '../data/types';
import { scenarioQuestions } from '../data/questions';

export const COMPARE_CITY_LIMIT = 4;

/** 每城一色：航海蓝 / 陶土 / 黄铜 / 海图青 */
export const COMPARE_COLORS = ['#1D3557', '#C96A52', '#B98A2F', '#3E7C8F'];

/** 滑杆值域 */
export const WEIGHT_SLIDER_MAX = 5;
export const WEIGHT_SLIDER_STEP = 0.1;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ---- 中性基准档案（未测评时的对比基准，页面需注明） ----

const NEUTRAL_MBTI: Record<string, string> = Object.fromEntries(
  scenarioQuestions.map((q) => [q.id, '']),
);

export const NEUTRAL_ANSWERS: UserAnswers = {
  mbti: NEUTRAL_MBTI,
  lifestyle: {
    budget: '1500-2500',
    climate: 'any',
    pace: 'balanced',
    size: 'mid',
    social: 'mid',
    language: 'basic',
    visa: 'mid',
    remote: 'mid',
  },
  interests: [],
};

// ---- 权重 ----

/** 有测评结果时的默认滑杆值：引擎 11 维权重 ×10，份额与引擎完全一致 */
export function defaultWeights(): Record<string, number> {
  return Object.fromEntries(
    PREFERENCE_DIMENSIONS.map((d) => [d.key, PREFERENCE_WEIGHTS[d.key] * 10]),
  );
}

/** 无测评结果时的默认滑杆值：均分 */
export function equalWeights(): Record<string, number> {
  return Object.fromEntries(PREFERENCE_DIMENSIONS.map((d) => [d.key, 1]));
}

export function isDefaultWeights(weights: Record<string, number>, personalized: boolean): boolean {
  const base = personalized ? defaultWeights() : equalWeights();
  return PREFERENCE_DIMENSIONS.every((d) => Math.abs((weights[d.key] ?? 0) - base[d.key]) < 0.001);
}

/** 权重百分比份额（最大余数法，保证全部维度份额合计恒为 100） */
export function weightShare(weights: Record<string, number>, key: string): number {
  const keys = PREFERENCE_DIMENSIONS.map((d) => d.key);
  const safe = (k: string): number => Math.max(0, weights[k] ?? 0);
  const sum = keys.reduce((s, k) => s + safe(k), 0);
  if (sum <= 0) return Math.round(100 / keys.length);

  const raw = keys.map((k) => (safe(k) / sum) * 100);
  const floors = raw.map((v) => Math.floor(v));
  let remainder = 100 - floors.reduce((s, v) => s + v, 0);
  const order = keys
    .map((_, i) => i)
    .sort((a, b) => raw[b] - floors[b] - (raw[a] - floors[a]));
  const shares = [...floors];
  let i = 0;
  while (remainder > 0) {
    shares[order[i % order.length]] += 1;
    remainder -= 1;
    i += 1;
  }
  return shares[keys.indexOf(key)];
}

// ---- 对比行 ----

export interface CompareRow {
  city: City;
  color: string;
  /** 对比综合分（与引擎同校准：52 + raw*0.46；缺失类按权重降权；v3 含 Tier 3） */
  composite: number;
  personalityFit: number | null;
  prefWeighted: number | null;
  interestFit: number | null;
  /** 引擎 v3 Tier 3 加分层（lite / 无信号时 null） */
  tier3Fit: number | null;
  fitDetails: Record<string, number | null>;
}

export function buildCompareRow(
  city: City,
  color: string,
  answers: UserAnswers,
  weights: Record<string, number>,
): CompareRow {
  const fits = computeCityFits(city, answers);
  const riasecFit = fits.riasecFit ?? null;
  const riskFit = fits.riskFit ?? null;

  // 临时权重聚合：null 维（无数据）跳过 → 降权不惩罚；0 权重维同样剔除
  let num = 0;
  let den = 0;
  for (const d of PREFERENCE_DIMENSIONS) {
    const v = fits.fitValues[d.key];
    if (v == null) continue;
    const w = Math.max(0, weights[d.key] ?? 0);
    num += v * w;
    den += w;
  }
  const prefWeighted: number | null = den > 0 ? num / den : null;

  // 引擎 v3 分层聚合（与 assess 同口径：Tier 2 降权 + Tier 3 ≤10% 加分）
  const airFit = fits.airFit ?? null;
  const raw = aggregateV3Raw({
    personalityFit: fits.personalityFit,
    preferenceFit: prefWeighted,
    interestFit: fits.interestFit,
    riasecFit,
    riskFit,
    airFit,
  });

  // Tier 3 独立展示分（三信号按 TIER3_WEIGHTS 归一）
  const t3Parts: [number | null, number][] = [
    [riasecFit, TIER3_WEIGHTS.riasecBoost],
    [riskFit, TIER3_WEIGHTS.riskLink],
    [airFit, TIER3_WEIGHTS.airFit],
  ];
  let t3n = 0;
  let t3d = 0;
  for (const [v, w] of t3Parts) {
    if (v == null) continue;
    t3n += v * w;
    t3d += w;
  }
  const tier3Fit = t3d > 0 ? t3n / t3d : null;

  const r1 = (v: number | null): number | null => (v == null ? null : Math.round(v));
  const fitDetails: Record<string, number | null> = {};
  for (const d of PREFERENCE_DIMENSIONS) {
    const v = fits.fitValues[d.key];
    fitDetails[d.key] = v == null ? null : Math.round(v);
  }

  return {
    city,
    color,
    composite: Math.round(clamp(52 + raw * 0.46, 0, 99)),
    personalityFit: r1(fits.personalityFit),
    prefWeighted: r1(prefWeighted),
    interestFit: r1(fits.interestFit),
    tier3Fit: r1(tier3Fit),
    fitDetails,
  };
}

export function rankRows(rows: CompareRow[]): CompareRow[] {
  return [...rows].sort((a, b) => b.composite - a.composite);
}

// ---- 生活成本对比结论（规则模板，无外部 LLM） ----

export interface CostComparison {
  aName: string;
  bName: string;
  diffUSD: number | null;
  diffPct: number | null;
  diffIndex: number | null;
  conclusion: string;
}

export function compareCost(a: City, b: City): CostComparison {
  const hasCost = a.monthlyCostUSD != null && b.monthlyCostUSD != null;
  const hasIndex = a.livingScore != null && b.livingScore != null;

  if (!hasCost && !hasIndex) {
    return {
      aName: a.nameZh,
      bName: b.nameZh,
      diffUSD: null,
      diffPct: null,
      diffIndex: null,
      conclusion: `${a.nameZh} 与 ${b.nameZh} 的成本数据暂缺，无法生成结论——建议查询官方公开统计渠道后对比。`,
    };
  }

  if (hasCost) {
    const ac = a.monthlyCostUSD!;
    const bc = b.monthlyCostUSD!;
    const diffUSD = ac - bc;
    const lower = Math.min(ac, bc) || 1;
    const diffPct = Math.round((Math.abs(diffUSD) / lower) * 100);
    const diffIndex = hasIndex ? a.livingScore! - b.livingScore! : null;
    const hi = diffUSD >= 0 ? a : b;
    const lo = diffUSD >= 0 ? b : a;
    const usd = Math.abs(diffUSD).toLocaleString('en-US');

    let conclusion: string;
    if (diffUSD === 0) {
      conclusion = `${a.nameZh} 与 ${b.nameZh} 的月均综合成本估算相同（~$${ac.toLocaleString('en-US')}），差异主要体现在租金结构与消费习惯上。`;
    } else {
      const indexPart = hasIndex
        ? `；综合生活指数相差 ${Math.abs(diffIndex!)} 点（NYC=100 基准）`
        : '';
      conclusion = `${hi.nameZh} 月均综合成本约 $${hi.monthlyCostUSD!.toLocaleString('en-US')}，比 ${lo.nameZh}（~$${lo.monthlyCostUSD!.toLocaleString('en-US')}）高约 $${usd}（约 ${diffPct}%，以较低者为基准）${indexPart}。`;
    }
    return {
      aName: a.nameZh,
      bName: b.nameZh,
      diffUSD,
      diffPct,
      diffIndex,
      conclusion,
    };
  }

  // 仅指数可比
  const diffIndex = a.livingScore! - b.livingScore!;
  const hi = diffIndex >= 0 ? a : b;
  const lo = diffIndex >= 0 ? b : a;
  return {
    aName: a.nameZh,
    bName: b.nameZh,
    diffUSD: null,
    diffPct: null,
    diffIndex,
    conclusion: `${hi.nameZh} 的综合生活指数比 ${lo.nameZh} 高 ${Math.abs(diffIndex)} 点（NYC=100 基准）；月均综合成本绝对值数据暂缺。`,
  };
}
