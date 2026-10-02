// 城市对比页计算层：临时权重重算 + 成本对比结论模板
// 注意：这里的重算只作用于对比页展示，不回写引擎与报告。
import { PREFERENCE_DIMENSIONS } from './analysis';
import {
  computeCityFits,
  PREFERENCE_WEIGHTS,
  WEIGHTS,
  type UserAnswers,
} from './engine';
import type { City } from '../data/types';
import { mbtiQuestions } from '../data/questions';

export const COMPARE_CITY_LIMIT = 4;

/** 每城一色：航线墨绿 / 陶土 / 黄铜 / 海图青灰 */
export const COMPARE_COLORS = ['#335043', '#BE5A38', '#B08544', '#466F66'];

/** 滑杆值域 */
export const WEIGHT_SLIDER_MAX = 5;
export const WEIGHT_SLIDER_STEP = 0.1;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ---- 中性基准档案（未测评时的对比基准，页面需注明） ----

const NEUTRAL_MBTI: Record<string, number> = Object.fromEntries(
  mbtiQuestions.map((q) => [q.id, 4]),
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

/** 有测评结果时的默认滑杆值：引擎 8 维权重 ×10，份额与引擎完全一致 */
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
  /** 对比综合分（与引擎同校准：52 + raw*0.46） */
  composite: number;
  personalityFit: number;
  prefWeighted: number;
  interestFit: number;
  fitDetails: Record<string, number>;
}

export function buildCompareRow(
  city: City,
  color: string,
  answers: UserAnswers,
  weights: Record<string, number>,
): CompareRow {
  const fits = computeCityFits(city, answers);
  const wsum = PREFERENCE_DIMENSIONS.reduce(
    (s, d) => s + Math.max(0, weights[d.key] ?? 0),
    0,
  );
  const safeSum = wsum > 0 ? wsum : 1;
  const prefWeighted =
    PREFERENCE_DIMENSIONS.reduce(
      (sum, d) => sum + fits.fitValues[d.key] * Math.max(0, weights[d.key] ?? 0),
      0,
    ) / safeSum;

  const raw =
    fits.personalityFit * WEIGHTS.personality +
    prefWeighted * WEIGHTS.preference +
    fits.interestFit * WEIGHTS.interest;

  const fitDetails: Record<string, number> = {};
  for (const d of PREFERENCE_DIMENSIONS) {
    fitDetails[d.key] = Math.round(fits.fitValues[d.key]);
  }

  return {
    city,
    color,
    composite: Math.round(clamp(52 + raw * 0.46, 0, 99)),
    personalityFit: Math.round(fits.personalityFit),
    prefWeighted: Math.round(prefWeighted),
    interestFit: Math.round(fits.interestFit),
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
  diffUSD: number;
  diffPct: number;
  diffIndex: number;
  conclusion: string;
}

export function compareCost(a: City, b: City): CostComparison {
  const diffUSD = a.monthlyCostUSD - b.monthlyCostUSD;
  const lower = Math.min(a.monthlyCostUSD, b.monthlyCostUSD) || 1;
  const diffPct = Math.round((Math.abs(diffUSD) / lower) * 100);
  const diffIndex = a.costIndex - b.costIndex;
  const hi = diffUSD >= 0 ? a : b;
  const lo = diffUSD >= 0 ? b : a;
  const usd = Math.abs(diffUSD).toLocaleString('en-US');

  let conclusion: string;
  if (diffUSD === 0) {
    conclusion = `${a.nameZh} 与 ${b.nameZh} 的月均综合成本估算相同（~$${a.monthlyCostUSD.toLocaleString('en-US')}），差异主要体现在租金结构与消费习惯上。`;
  } else {
    conclusion = `${hi.nameZh} 月均综合成本约 $${hi.monthlyCostUSD.toLocaleString('en-US')}，比 ${lo.nameZh}（~$${lo.monthlyCostUSD.toLocaleString('en-US')}）高约 $${usd}（约 ${diffPct}%，以较低者为基准）；生活成本指数相差 ${Math.abs(diffIndex)} 点（Numbeo 口径，NYC=100）。`;
  }

  return { aName: a.nameZh, bName: b.nameZh, diffUSD, diffPct, diffIndex, conclusion };
}
