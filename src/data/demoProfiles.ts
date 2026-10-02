// 演示档案：预设测评答案，让访客跳过答题直接查看完整报告。
// 答案按人设构造，与引擎七级量表口径严格自洽（正向字母 = E/N/F/P）。

import { mbtiQuestions, type Pole } from './questions';
import type { UserAnswers } from '../lib/engine';

const POSITIVE_POLES = new Set<Pole>(['E', 'N', 'F', 'P']);

interface AxisTarget {
  axis: 'EI' | 'SN' | 'TF' | 'JP';
  /** 该轴的目标字母 */
  letter: Pole;
  /** 强度 0-3（0 = 中立，3 = 完全倾向） */
  strength: number;
}

export interface DemoProfile {
  id: string;
  label: string;
  tagline: string;
  desc: string;
  /** 预期 16 型（用于演示自洽性校验） */
  expectedType: string;
  mbtiTargets: AxisTarget[];
  lifestyle: Record<string, string>;
  interests: string[];
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'introvert-freelancer',
    label: '内向型自由职业者',
    tagline: 'I 高分 · 远程办公条件优先',
    desc: '安静街区、高速网络、低社交消耗——深度工作者的定居画像。',
    expectedType: 'INTJ',
    mbtiTargets: [
      { axis: 'EI', letter: 'I', strength: 3 },
      { axis: 'SN', letter: 'N', strength: 2 },
      { axis: 'TF', letter: 'T', strength: 2 },
      { axis: 'JP', letter: 'J', strength: 1 },
    ],
    lifestyle: {
      budget: '2500-4000',
      climate: 'temperate',
      pace: 'balanced',
      size: 'mid',
      social: 'low',
      language: 'high-english',
      visa: 'mid',
      remote: 'high',
    },
    interests: ['coffee', 'startup', 'history', 'nature'],
  },
  {
    id: 'extrovert-founder',
    label: '外向型创业者',
    tagline: 'E 高分 · 社群密度优先',
    desc: '大都市、快节奏、创业社群与夜生活——把能量变成机会的画像。',
    expectedType: 'ENTP',
    mbtiTargets: [
      { axis: 'EI', letter: 'E', strength: 3 },
      { axis: 'SN', letter: 'N', strength: 2 },
      { axis: 'TF', letter: 'T', strength: 1 },
      { axis: 'JP', letter: 'P', strength: 2 },
    ],
    lifestyle: {
      budget: '2500-4000',
      climate: 'any',
      pace: 'fast',
      size: 'metro',
      social: 'high',
      language: 'high-english',
      visa: 'mid',
      remote: 'mid',
    },
    interests: ['startup', 'nightlife', 'food', 'coffee', 'festivals'],
  },
  {
    id: 'family-with-kids',
    label: '有幼儿的家庭',
    tagline: 'J 高分 · 签证与安全优先',
    desc: '慢节奏、气候温润、签证友好、社区安全——带娃长居的务实画像。',
    expectedType: 'ESFJ',
    mbtiTargets: [
      { axis: 'EI', letter: 'E', strength: 1 },
      { axis: 'SN', letter: 'S', strength: 2 },
      { axis: 'TF', letter: 'F', strength: 2 },
      { axis: 'JP', letter: 'J', strength: 3 },
    ],
    lifestyle: {
      budget: '2500-4000',
      climate: 'mediterranean',
      pace: 'slow',
      size: 'mid',
      social: 'mid',
      language: 'basic',
      visa: 'high',
      remote: 'mid',
    },
    interests: ['outdoor', 'beach', 'food', 'pets', 'fitness'],
  },
];

/**
 * 按「目标字母 + 强度」构造七级量表作答。
 * 引擎口径：alignedPlus = (value - 4) * POLE_SIGN[right.pole]（正向字母 E/N/F/P），
 * 解出 value = 4 + k * POLE_SIGN[right.pole]，其中
 * k = strength * (目标字母为正向 ? 1 : -1)。
 */
export function buildDemoAnswers(profile: DemoProfile): UserAnswers {
  const targetByAxis = new Map(profile.mbtiTargets.map((t) => [t.axis, t]));
  const mbti: Record<string, number> = {};
  for (const q of mbtiQuestions) {
    const target = targetByAxis.get(q.axis);
    if (!target) {
      mbti[q.id] = 4;
      continue;
    }
    const k = target.strength * (POSITIVE_POLES.has(target.letter) ? 1 : -1);
    const poleSign = POSITIVE_POLES.has(q.right.pole) ? 1 : -1;
    mbti[q.id] = Math.min(7, Math.max(1, 4 + k * poleSign));
  }
  return {
    mbti,
    lifestyle: { ...profile.lifestyle },
    interests: [...profile.interests],
  };
}
