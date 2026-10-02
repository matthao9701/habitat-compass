import type { City, CityTraitVector } from '../data/types';
import { cities } from '../data';
import { interestLabelById } from '../data/interests';
import type { MBTIQuestion, Pole } from '../data/questions';
import { mbtiQuestions, lifestyleQuestions } from '../data/questions';

// ---------------------------------------------------------------------------
// 用户答案与测评结果类型
// ---------------------------------------------------------------------------

export type Choice = 'a' | 'b';

export interface UserAnswers {
  mbti: Record<string, Choice>;
  lifestyle: Record<string, string>;
  interests: string[];
}

export interface DimensionScores {
  /** 生活成本契合 */
  cost: number;
  /** 远程办公（网络） */
  internet: number;
  /** 安全指数 */
  safety: number;
  /** 数字游民社区 */
  community: number;
  /** 英语友好度 */
  english: number;
  /** 签证灵活度 */
  visa: number;
}

export interface CityMatch {
  city: City;
  /** 展示用匹配度 0-100 */
  match: number;
  personalityFit: number;
  preferenceFit: number;
  interestFit: number;
  scores: DimensionScores;
  reasons: string[];
}

export interface AssessmentResult {
  typeCode: string;
  /** 四个维度的位置：正为 E/N/F/P，负为 I/S/T/J（-100..100） */
  traitVector: CityTraitVector;
  preferences: UserAnswers['lifestyle'];
  interests: string[];
  profileTags: string[];
  matches: CityMatch[];
}

// ---------------------------------------------------------------------------
// 常量与映射
// ---------------------------------------------------------------------------

const AXES = ['EI', 'SN', 'TF', 'JP'] as const;
type AxisName = (typeof AXES)[number];

const POLE_SIGN: Record<Pole, number> = {
  E: 1, I: -1, N: 1, S: -1, F: 1, T: -1, P: 1, J: -1,
};

const WEIGHTS = {
  personality: 0.3,
  preference: 0.48,
  interest: 0.22,
};

const PREFERENCE_WEIGHTS: Record<string, number> = {
  budget: 0.22,
  climate: 0.14,
  pace: 0.12,
  size: 0.1,
  social: 0.12,
  language: 0.1,
  visa: 0.1,
  remote: 0.1,
};

const ORDINAL_MAP: Record<string, Record<string, number>> = {
  pace: { slow: 1, balanced: 3, fast: 5 },
  size: { small: 1, mid: 3, metro: 5 },
  social: { low: 1, mid: 3, high: 5 },
  language: { 'high-english': 5, basic: 3, 'no-barrier': 1 },
  visa: { high: 5, mid: 3, low: 1 },
  remote: { high: 5, mid: 3, basic: 1 },
};

const CLIMATE_COMPAT: Record<string, Record<string, number>> = {
  tropical: { tropical: 100, subtropical: 72, desert: 42 },
  mediterranean: { mediterranean: 100, desert: 58, subtropical: 52, temperate: 52 },
  temperate: { temperate: 100, continental: 72, subtropical: 55 },
  cool: { continental: 100, temperate: 72, desert: 45 },
};

const BUDGET_TIERS: Record<string, [number, number]> = {
  lt1000: [0, 1000],
  '1000-1500': [1000, 1500],
  '1500-2500': [1500, 2500],
  '2500-4000': [2500, 4000],
  gt4000: [4000, 8000],
};

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

// ---------------------------------------------------------------------------
// 展示用格式化
// ---------------------------------------------------------------------------

export const INTERNET_SPEED = [0, 12, 25, 45, 75, 110];
export const INTERNET_LABEL = ['', '基础', '可用', '良好', '快速', '极速'];

export const CLIMATE_LABEL: Record<string, string> = {
  tropical: '热带',
  subtropical: '亚热带',
  mediterranean: '地中海气候',
  temperate: '温带气候',
  continental: '大陆性气候',
  desert: '干旱/沙漠气候',
};

export const AXIS_LABEL: Record<AxisName, [string, string]> = {
  EI: ['外向 E', '内向 I'],
  SN: ['直觉 N', '实感 S'],
  TF: ['情感 F', '思考 T'],
  JP: ['感知 P', '判断 J'],
};

export function scoreLevel(v: number): string {
  if (v >= 80) return '优秀';
  if (v >= 65) return '良好';
  if (v >= 50) return '中等';
  return '偏弱';
}

export function formatCost(city: City): string {
  return `$${city.cost[0].toLocaleString('en-US')} – $${city.cost[1].toLocaleString('en-US')}`;
}

// ---------------------------------------------------------------------------
// 单项打分
// ---------------------------------------------------------------------------

function costFit(city: City, tierValue: string): number {
  const tier = BUDGET_TIERS[tierValue];
  if (!tier) return 70;
  const mid = (city.cost[0] + city.cost[1]) / 2;
  const over = Math.max(0, mid - tier[1]);
  const under = Math.max(0, tier[0] - city.cost[1]);
  return clamp(100 - over * 0.12 - under * 0.02, 5, 100);
}

function climateFit(city: City, pref: string): number {
  if (pref === 'any') return 80;
  return CLIMATE_COMPAT[pref]?.[city.climate] ?? 30;
}

function ordinalFit(user: number, cityValue: number): number {
  return clamp(100 - 26 * Math.abs(user - cityValue), 0, 100);
}

function interestFit(userTags: string[], cityTags: string[]): number {
  if (userTags.length === 0) return 72;
  const matched = userTags.filter((t) => cityTags.includes(t)).length;
  const precision = (matched / userTags.length) * 70;
  const recall = (matched / cityTags.length) * 30;
  return clamp((precision + recall) * 100 / 100, 0, 100);
}

// ---------------------------------------------------------------------------
// MBTI 人格
// ---------------------------------------------------------------------------

function axisQuestionCount(axis: AxisName): number {
  return mbtiQuestions.filter((q: MBTIQuestion) => q.axis === axis).length;
}

export function derivePersonality(mbtiAnswers: Record<string, Choice>): {
  typeCode: string;
  traitVector: CityTraitVector;
} {
  const counts: Record<AxisName, { plus: number; minus: number }> = {
    EI: { plus: 0, minus: 0 },
    SN: { plus: 0, minus: 0 },
    TF: { plus: 0, minus: 0 },
    JP: { plus: 0, minus: 0 },
  };

  for (const q of mbtiQuestions) {
    const choice = mbtiAnswers[q.id];
    if (!choice) continue;
    const pole = choice === 'a' ? q.a.pole : q.b.pole;
    const bucket = counts[q.axis];
    if (POLE_SIGN[pole] > 0) bucket.plus += 1;
    else bucket.minus += 1;
  }

  const vector: CityTraitVector = { ei: 0, sn: 0, tf: 0, jp: 0 };
  const letters: string[] = [];
  const positiveLetter: Record<AxisName, [string, string]> = {
    EI: ['E', 'I'],
    SN: ['N', 'S'],
    TF: ['F', 'T'],
    JP: ['P', 'J'],
  };

  for (const axis of AXES) {
    const { plus, minus } = counts[axis];
    const total = axisQuestionCount(axis);
    vector[axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp'] =
      Math.round(((plus - minus) / total) * 100);
    letters.push(plus >= minus ? positiveLetter[axis][0] : positiveLetter[axis][1]);
  }

  return { typeCode: letters.join(''), traitVector: vector };
}

// ---------------------------------------------------------------------------
// 推荐理由生成
// ---------------------------------------------------------------------------

const TRAIT_NAME: Record<AxisName, { positive: string; negative: string }> = {
  EI: { positive: '外向社交型', negative: '内向独处型' },
  SN: { positive: '直觉探索型', negative: '务实落地型' },
  TF: { positive: '情感共鸣型', negative: '逻辑效率型' },
  JP: { positive: '随兴灵活型', negative: '规划秩序型' },
};

function buildReasons(
  city: City,
  result: {
    traitVector: CityTraitVector;
    preferences: UserAnswers['lifestyle'];
    interests: string[];
    scores: DimensionScores;
    costFitScore: number;
  },
): string[] {
  const reasons: string[] = [];

  // 人格契合（四轴中契合最高的一条）
  const axisKeys: AxisName[] = ['EI', 'SN', 'TF', 'JP'];
  const traitDiffs = axisKeys.map((axis) => {
    const key = axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp';
    return { axis, diff: Math.abs(result.traitVector[key] - city.traits[key]) };
  });
  traitDiffs.sort((x, y) => x.diff - y.diff);
  const best = traitDiffs[0];
  if (best.diff <= 40) {
    const cityIsPositive = city.traits[best.axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp'] >= 0;
    const persona = cityIsPositive
      ? TRAIT_NAME[best.axis].positive
      : TRAIT_NAME[best.axis].negative;
    reasons.push(`城市气质偏${persona}，与你的人格倾向同频`);
  }

  // 兴趣重合
  const matchedInterests = result.interests.filter((t) => city.tags.includes(t));
  if (matchedInterests.length > 0) {
    const labels = matchedInterests
      .slice(0, 3)
      .map((t) => interestLabelById.get(t) ?? t)
      .join('、');
    reasons.push(`覆盖你关注的「${labels}」场景`);
  }

  // 预算
  if (result.costFitScore >= 80) {
    reasons.push(`月生活成本 ${formatCost(city)}，与你的预算区间高度匹配`);
  }

  // 英语
  if (result.scores.english >= 80) {
    reasons.push('英语友好度高，办事、就医与日常沟通门槛低');
  }

  // 签证
  if (result.scores.visa >= 80) {
    reasons.push('签证 / 居留路径灵活，适合反复进出或长期停留');
  }

  // 网络
  if (result.scores.internet >= 80) {
    reasons.push('网络基础设施出色，远程办公与视频会议稳定');
  }

  // 安全
  if (result.scores.safety >= 72) {
    reasons.push(`安全指数 ${city.safety}，夜间出行与长住更安心`);
  }

  // 兜底
  if (reasons.length === 0) {
    reasons.push('在人格、偏好与兴趣三维度综合表现均衡');
  }

  return reasons.slice(0, 3);
}

// ---------------------------------------------------------------------------
// 用户画像标签
// ---------------------------------------------------------------------------

export function buildProfileTags(result: {
  typeCode: string;
  preferences: UserAnswers['lifestyle'];
  interests: string[];
}): string[] {
  const tags: string[] = [result.typeCode];
  for (const q of lifestyleQuestions) {
    const value = result.preferences[q.id];
    const option = q.options.find((o) => o.value === value);
    if (option) tags.push(option.label);
  }
  for (const id of result.interests.slice(0, 6)) {
    tags.push(interestLabelById.get(id) ?? id);
  }
  return tags;
}

// ---------------------------------------------------------------------------
// 主入口：计算整份报告
// ---------------------------------------------------------------------------

export function assess(answers: UserAnswers): AssessmentResult {
  const { typeCode, traitVector } = derivePersonality(answers.mbti);

  const preferenceInputs = answers.lifestyle;

  const matches: CityMatch[] = cities.map((city: City) => {
    // ---- 人格契合：四轴相似度均值 ----
    const axisKeys: AxisName[] = ['EI', 'SN', 'TF', 'JP'];
    const personalityFit =
      axisKeys.reduce((sum: number, axis) => {
        const key = axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp';
        const dist = Math.abs(traitVector[key] - city.traits[key]);
        return sum + clamp(100 - dist / 2, 0, 100);
      }, 0) / axisKeys.length;

    // ---- 偏好契合：加权均值 ----
    const fitValues: Record<string, number> = {
      budget: costFit(city, preferenceInputs.budget ?? ''),
      climate: climateFit(city, preferenceInputs.climate ?? 'any'),
      pace: ordinalFit(ORDINAL_MAP.pace[preferenceInputs.pace ?? 'balanced'] ?? 3, city.pace),
      size: ordinalFit(ORDINAL_MAP.size[preferenceInputs.size ?? 'mid'] ?? 3, city.size),
      social: ordinalFit(ORDINAL_MAP.social[preferenceInputs.social ?? 'mid'] ?? 3, city.community),
      language: ordinalFit(
        ORDINAL_MAP.language[preferenceInputs.language ?? 'basic'] ?? 3,
        city.english,
      ),
      visa: ordinalFit(ORDINAL_MAP.visa[preferenceInputs.visa ?? 'mid'] ?? 3, city.visaScore),
      remote: ordinalFit(ORDINAL_MAP.remote[preferenceInputs.remote ?? 'mid'] ?? 3, city.internet),
    };

    const weightSum = Object.keys(PREFERENCE_WEIGHTS).reduce(
      (s, k) => s + PREFERENCE_WEIGHTS[k],
      0,
    );
    const preferenceFit =
      Object.keys(PREFERENCE_WEIGHTS).reduce(
        (sum, k) => sum + fitValues[k] * PREFERENCE_WEIGHTS[k],
        0,
      ) / weightSum;

    // ---- 兴趣重合 ----
    const interestsFitScore = interestFit(answers.interests, city.tags);

    const raw =
      personalityFit * WEIGHTS.personality +
      preferenceFit * WEIGHTS.preference +
      interestsFitScore * WEIGHTS.interest;

    // 校准到直观的匹配度区间（~66 – 97）
    const match = Math.round(clamp(52 + raw * 0.46, 0, 99));

    const scores: DimensionScores = {
      cost: Math.round(fitValues.budget),
      internet: city.internet * 20,
      safety: city.safety,
      community: city.community * 20,
      english: city.english * 20,
      visa: city.visaScore * 20,
    };

    const reasons = buildReasons(city, {
      traitVector,
      preferences: preferenceInputs,
      interests: answers.interests,
      scores,
      costFitScore: fitValues.budget,
    });

    return {
      city,
      match,
      personalityFit: Math.round(personalityFit),
      preferenceFit: Math.round(preferenceFit),
      interestFit: Math.round(interestsFitScore),
      scores,
      reasons,
    };
  });

  matches.sort((a, b) => b.match - a.match);

  const profileTags = buildProfileTags({
    typeCode,
    preferences: answers.lifestyle,
    interests: answers.interests,
  });

  return {
    typeCode,
    traitVector,
    preferences: answers.lifestyle,
    interests: answers.interests,
    profileTags,
    matches: matches.slice(0, 5),
  };
}
