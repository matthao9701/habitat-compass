// 演示档案：预设测评答案，让访客跳过答题直接查看完整报告。
// 答案按人设构造，与引擎 SJT 二元迫选口径自洽（正向字母 = E/N/F/P）。

import { scenarioQuestions, type Pole } from './questions';
import type { UserAnswers } from '../lib/engine';

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
      pace: 'slow',
      size: 'small',
      social: 'low',
      language: 'high-english',
      visa: 'high',
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
      visa: 'high',
      remote: 'high',
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
      size: 'small',
      social: 'high',
      language: 'no-barrier',
      visa: 'high',
      remote: 'high',
    },
    interests: ['outdoor', 'beach', 'food', 'pets', 'fitness'],
  },
];

/** 正向字母（引擎正向 = E/N/F/P）；与 questions.ts 的 a 选项一致 */
const POSITIVE_POLES = new Set<Pole>(['E', 'N', 'F', 'P']);

/** 强度 → 该轴 8 题中选中「正向字母」的题数 */
const POSITIVE_TARGET_COUNT: Record<number, Record<'pos' | 'neg', number>> = {
  0: { pos: 4, neg: 4 },
  1: { pos: 6, neg: 2 },
  2: { pos: 7, neg: 1 },
  3: { pos: 8, neg: 0 },
};

/**
 * 按「目标字母 + 强度」构造 SJT 二元迫选作答（'a' | 'b'）。
 * 每题 a/b 各指向一个极，选中「正向字母」的题数由强度决定：
 * 目标为正向字母（E/N/F/P）时取 POSITIVE_TARGET_COUNT[strength].pos，
 * 目标为反向字母（I/S/T/J）时取 .neg；据此逐题挑选指向对应极的选项。
 */
export function buildDemoAnswers(profile: DemoProfile): UserAnswers {
  const targetByAxis = new Map(profile.mbtiTargets.map((t) => [t.axis, t]));
  const mbti: Record<string, string> = {};
  for (const q of scenarioQuestions) {
    const target = targetByAxis.get(q.axis);
    const aIsPositive = POSITIVE_POLES.has(q.a.pole);
    if (!target) {
      // 无目标：选指向正向极的选项（中性）
      mbti[q.id] = aIsPositive ? 'a' : 'b';
      continue;
    }
    const wantPositive = POSITIVE_POLES.has(target.letter);
    const wantCount = POSITIVE_TARGET_COUNT[target.strength][wantPositive ? 'pos' : 'neg'];
    const seen = scenarioQuestions.filter((s) => s.axis === q.axis);
    const idx = seen.findIndex((s) => s.id === q.id);
    const choosePositive = idx < wantCount;
    mbti[q.id] = (aIsPositive === choosePositive) ? 'a' : 'b';
  }
  return {
    mbti,
    lifestyle: { ...profile.lifestyle },
    interests: [...profile.interests],
  };
}
