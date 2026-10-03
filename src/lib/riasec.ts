/**
 * RIASEC（O*NET Interest Profiler Short Form）与 IPIP Risk-Taking 计分层（第八轮）
 * - RIASEC：六维百分位 + Top2 组合画像 + 标签权重强化（不改引擎 30/48/22 结构，
 *   强化沿用「userTags 重复出现 = 权重加倍」机制，与二级子项叠加后封顶）
 * - Risk：风险偏好分（0-100）与三档解读，仅报告页展示，不进引擎加权
 */
import {
  riasecQuestions,
  RIASEC_DIMS,
  type RiasecKey,
} from '../data/riasec';
import { RIASEC_TAG_BOOST } from '../data/riasecMap';
import { riskQuestions } from '../data/riskTaking';
import { reinforcedTags } from '../data/interestsPro';
import type { UserAnswers } from './engine';

/** RIASEC 维度强化触发阈值：维度百分位 ≥ 60 视为「高分维」 */
export const RIASEC_BOOST_THRESHOLD = 60;

/**
 * 标签强化重复次数封顶：0 = 基础权重 ×1，
 * 1 = ×2（与现有子项强化同级），2 = ×3（双层信号叠加上限）
 */
export const RIASEC_REPEAT_CAP = 2;

export interface RiasecProfile {
  /** 六维原始分（5-25；维度内未答题按缺失剔除） */
  scores: Record<RiasecKey, number>;
  /** 六维百分位（0-100，每题 (v-1)/4 均值） */
  percent: Record<RiasecKey, number>;
  /** 得分最高的两维（并列时按 R→I→A→S→E→C 顺序稳定排序） */
  top2: [RiasecKey, RiasecKey];
  /** Top2 组合键（如 'RA'），对应词典 riasec.combo.RA 的画像描述 */
  combo: string;
}

export type RiskBand = 'high' | 'mid' | 'low';

export interface RiskProfile {
  /** 风险偏好分（0-100） */
  score: number;
  band: RiskBand;
}

/** 单题计分是否有效（1-5 整数） */
function validScale(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 5;
}

/** RIASEC 计分：每维 5 题 × 5 点喜好量表 */
export function deriveRiasec(riasecAnswers: Record<string, number>): RiasecProfile {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } as Record<RiasecKey, number>;
  const percent = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } as Record<RiasecKey, number>;

  for (const dim of RIASEC_DIMS) {
    const items = riasecQuestions.filter((q) => q.dim === dim);
    let sum = 0;
    let count = 0;
    for (const q of items) {
      const v = riasecAnswers[q.id];
      if (validScale(v)) {
        sum += v;
        count++;
      }
    }
    scores[dim] = sum;
    // 每题 (v-1)/4 ∈ [0,1] → 均值 × 100；count=0 时保持 0
    percent[dim] = count === 0 ? 0 : Math.round(((sum - count) / (count * 4)) * 100);
  }

  const ranked = [...RIASEC_DIMS].sort((a, b) => percent[b] - percent[a]);
  const top2: [RiasecKey, RiasecKey] = [ranked[0], ranked[1]];
  // 组合键用字母序规范化（RA 与 AR 同属一个画像，避免 30 种有序组合 ×2 的词典膨胀）
  const combo = [...top2].sort().join('');

  return { scores, percent, top2, combo };
}

/**
 * 标签强化重复次数（两个独立信号源叠加，封顶 RIASEC_REPEAT_CAP）：
 * 1. 二级子项强化（原有机制：选中子项的一级标签 +1 次重复）
 * 2. RIASEC 高分维（percent ≥ RIASEC_BOOST_THRESHOLD）的映射标签 +1 次重复
 * 只强化用户已选中的标签（与原机制一致，不凭空新增兴趣）。
 */
export function tagRepeats(answers: UserAnswers): Map<string, number> {
  const repeats = new Map<string, number>();
  if (answers.version !== 'pro') return repeats;

  const add = (tag: string): void => {
    if (!answers.interests.includes(tag)) return;
    repeats.set(tag, (repeats.get(tag) ?? 0) + 1);
  };

  if (answers.interestSubs) {
    for (const t of reinforcedTags(answers.interestSubs)) add(t);
  }
  if (answers.riasec) {
    const prof = deriveRiasec(answers.riasec);
    for (const dim of RIASEC_DIMS) {
      if (prof.percent[dim] >= RIASEC_BOOST_THRESHOLD) {
        for (const tag of RIASEC_TAG_BOOST[dim]) add(tag);
      }
    }
  }

  for (const [tag, n] of repeats) repeats.set(tag, Math.min(n, RIASEC_REPEAT_CAP));
  return repeats;
}

/** IPIP Risk-Taking 计分：keyed 反向题折算后取均值 ×100 */
export function deriveRisk(riskAnswers: Record<string, number>): RiskProfile | null {
  let sum = 0;
  let count = 0;
  for (const q of riskQuestions) {
    const v = riskAnswers[q.id];
    if (!validScale(v)) continue;
    const aligned = q.keyed === 1 ? (v - 1) / 4 : (5 - v) / 4;
    sum += aligned;
    count++;
  }
  if (count === 0) return null;
  const score = Math.round((sum / count) * 100);
  return { score, band: riskBandOf(score) };
}

/** 风险偏好三档阈值：high ≥65 / mid ≥35 / low <35 */
export function riskBandOf(score: number): RiskBand {
  if (score >= 65) return 'high';
  if (score >= 35) return 'mid';
  return 'low';
}
