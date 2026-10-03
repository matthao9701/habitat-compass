import type { City, CityTraitVector } from '../data/types';
import { cities } from '../data';
import { interestLabelById } from '../data/interests';
import type { MBTIQuestion, Pole } from '../data/questions';
import { mbtiQuestions, lifestyleQuestions } from '../data/questions';

// ---------------------------------------------------------------------------
// 用户答案与测评结果类型
// ---------------------------------------------------------------------------

export type AxisName = 'EI' | 'SN' | 'TF' | 'JP';

export interface UserAnswers {
  /** 阶段一：OEJTS 结构七级双极量表作答（1 = 完全符合左特征，4 = 中立，7 = 完全符合右特征） */
  mbti: Record<string, number>;
  /** 阶段二：生活偏好情景选择题作答 */
  lifestyle: Record<string, string>;
  /** 阶段三：兴趣标签多选 */
  interests: string[];
}

export interface DimensionScores {
  /** 生活成本契合 */
  cost: number | null;
  /** 远程办公（网络） */
  internet: number | null;
  /** 安全指数 */
  safety: number | null;
  /** 数字游民社区 */
  community: number | null;
  /** 英语友好度 */
  english: number | null;
  /** 签证灵活度 */
  visa: number | null;
}

export interface CityMatch {
  city: City;
  /** 展示用匹配度 0-100 */
  match: number;
  /** null = 城市缺该类数据，聚合时降权（不惩罚） */
  personalityFit: number | null;
  preferenceFit: number | null;
  interestFit: number | null;
  /** 11 个生活偏好维度的单项得分（0-100）；null = 城市该维度无数据（已降权） */
  fitDetails: Record<string, number | null>;
  scores: DimensionScores;
  reasons: string[];
}

export interface AssessmentResult {
  typeCode: string;
  /** 四个维度的位置：正为 E/N/F/P，负为 I/S/T/J（-100..100） */
  traitVector: CityTraitVector;
  /** 七级量表换算的偏好百分比（0-100，朝正向字母 E/N/F/P） */
  axisScores: Record<AxisName, number>;
  preferences: UserAnswers['lifestyle'];
  interests: string[];
  profileTags: string[];
  matches: CityMatch[];
}

// ---------------------------------------------------------------------------
// 常量与映射
// ---------------------------------------------------------------------------

const AXES = ['EI', 'SN', 'TF', 'JP'] as const;

const POLE_SIGN: Record<Pole, number> = {
  E: 1, I: -1, N: 1, S: -1, F: 1, T: -1, P: 1, J: -1,
};

export const WEIGHTS = {
  personality: 0.3,
  preference: 0.48,
  interest: 0.22,
};

/**
 * 偏好类内权重 v2（11 维，总和 = 1.0；三大类权重 30/48/22 不变）：
 * - 用户维度（8）：来自生活方式测评题的序数/区间打分
 * - 客观维度（3）：城市侧真实数据驱动（气候舒适 / 治安安全 / 英语普及），
 *   在用户维度之上补充参考信号
 * 城市某维度无数据（null）时，聚合按权重降权、不惩罚。
 */
export const PREFERENCE_WEIGHTS: Record<string, number> = {
  // 用户 8 维（合计 0.86）
  budget: 0.18,
  climate: 0.12,
  pace: 0.1,
  size: 0.09,
  social: 0.1,
  language: 0.09,
  visa: 0.09,
  remote: 0.09,
  // 客观 3 维（合计 0.14）
  climateComfort: 0.05,
  englishDepth: 0.04,
  safety: 0.05,
};

export const PREFERENCE_KEYS = Object.keys(PREFERENCE_WEIGHTS);

/** 客观维度键（打分不依赖用户答案，中性基准模式同样生效） */
export const OBJECTIVE_KEYS = ['climateComfort', 'englishDepth', 'safety'];

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
  if (!city.cost) return '成本数据暂缺';
  return `$${city.cost[0].toLocaleString('en-US')} – $${city.cost[1].toLocaleString('en-US')}`;
}

// ---------------------------------------------------------------------------
// 单项打分
// ---------------------------------------------------------------------------

function costFit(city: City, tierValue: string): number | null {
  if (!city.cost) return null;
  const tier = BUDGET_TIERS[tierValue];
  if (!tier) return 70;
  const mid = (city.cost[0] + city.cost[1]) / 2;
  const over = Math.max(0, mid - tier[1]);
  const under = Math.max(0, tier[0] - city.cost[1]);
  return clamp(100 - over * 0.12 - under * 0.02, 5, 100);
}

function climateFit(city: City, pref: string): number | null {
  if (pref === 'any') return 80;
  if (!city.climate) return null;
  return CLIMATE_COMPAT[pref]?.[city.climate] ?? 30;
}

function ordinalFit(user: number, cityValue: number): number {
  return clamp(100 - 26 * Math.abs(user - cityValue), 0, 100);
}

/** 用户序数答案 × 城市可空序数；城市无数据 → null（降权） */
function ordinalFitNullable(user: number, cityValue: number | null): number | null {
  if (cityValue == null) return null;
  return ordinalFit(user, cityValue);
}

/** 气候舒适（客观）：年均温舒适带（19°C 最优锚）+ 日照 / 降水微调，规则透明 */
function climateComfortFit(detail: City['climateDetail']): number | null {
  if (!detail) return null;
  const tempScore = 100 - Math.abs(detail.avgTempC - 19) * 6;
  const sunBonus = detail.sunshineHours >= 2500 ? 5 : detail.sunshineHours >= 1800 ? 2 : -4;
  const precipPenalty = detail.annualPrecipMm >= 1800 ? -5 : detail.annualPrecipMm >= 1400 ? -2 : 0;
  return clamp(tempScore + sunBonus + precipPenalty, 5, 100);
}

/** 英语普及（客观）：EF EPI 官方评级 → 分值；缺 EPI 回退 english 序数 × 20 */
const EPI_BAND_SCORE: Record<string, number> = {
  'very high': 95,
  high: 85,
  moderate: 72,
  low: 55,
  'very low': 40,
};

function englishDepthFit(city: City): number | null {
  if (city.englishEpiBand) return EPI_BAND_SCORE[city.englishEpiBand] ?? null;
  if (city.english != null) return city.english * 20;
  return null;
}

/** 治安（客观）：Numbeo Safety Index（0-100）直接映射 */
function safetyObjFit(safety: number | null): number | null {
  if (safety == null) return null;
  return clamp(safety, 5, 100);
}

function interestFit(userTags: string[], cityTags: string[]): number | null {
  if (cityTags.length === 0) return null; // 城市无标签数据 → 兴趣维度降权，不编造
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

/**
 * 阶段一计分（OEJTS 七级双极量表）：
 * 每题 1-7（1 = 完全符合左特征，4 = 中立，7 = 完全符合右特征），
 * 每维度 8 题求和换算为 8~56 的维度分与偏好百分比，得出 16 型。
 *
 * 口径：先把每题作答按「正向字母 = E/N/F/P」对齐——
 *   alignedPlus = (value - 4) * POLE_SIGN[right.pole] ∈ [-3, 3]，
 * 求和 rawPlus ∈ [-24, 24]，plusSum = rawPlus + 24 ∈ [0, 48]，
 * 维度 8~56 分 = plusSum + 8；偏好百分比 = plusSum / 48。
 */
export function derivePersonality(mbtiAnswers: Record<string, number>): {
  typeCode: string;
  traitVector: CityTraitVector;
  axisScores: Record<AxisName, number>;
} {
  const rawPlus: Record<AxisName, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };

  for (const q of mbtiQuestions) {
    const value = mbtiAnswers[q.id];
    if (typeof value !== 'number') continue;
    const v = clamp(Math.round(value), 1, 7);
    rawPlus[q.axis] += (v - 4) * POLE_SIGN[q.right.pole];
  }

  const vector: CityTraitVector = { ei: 0, sn: 0, tf: 0, jp: 0 };
  const axisScores: Record<AxisName, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const letters: string[] = [];
  const positiveLetter: Record<AxisName, [string, string]> = {
    EI: ['E', 'I'],
    SN: ['N', 'S'],
    TF: ['F', 'T'],
    JP: ['P', 'J'],
  };

  for (const axis of AXES) {
    const count = axisQuestionCount(axis);
    const halfRange = count * 3; // 每题最大偏移 3
    const plusSum = rawPlus[axis] + halfRange; // 0 .. 2*halfRange
    axisScores[axis] = Math.round((plusSum / (halfRange * 2)) * 100);
    vector[axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp'] = Math.round(
      ((plusSum - halfRange) / halfRange) * 100,
    );
    // 恰好中立（plusSum == halfRange）时归入正向字母，向量取 0
    letters.push(
      plusSum >= halfRange ? positiveLetter[axis][0] : positiveLetter[axis][1],
    );
  }

  return { typeCode: letters.join(''), traitVector: vector, axisScores };
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
    costFitScore: number | null;
  },
): string[] {
  const reasons: string[] = [];

  // 人格契合（四轴中契合最高的一条）；城市未标注 traits 时跳过
  if (city.traits) {
    const axisKeys: AxisName[] = ['EI', 'SN', 'TF', 'JP'];
    const traits = city.traits;
    const traitDiffs = axisKeys.map((axis) => {
      const key = axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp';
      return { axis, diff: Math.abs(result.traitVector[key] - traits[key]) };
    });
    traitDiffs.sort((x, y) => x.diff - y.diff);
    const best = traitDiffs[0];
    if (best.diff <= 40) {
      const cityIsPositive = traits[best.axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp'] >= 0;
      const persona = cityIsPositive
        ? TRAIT_NAME[best.axis].positive
        : TRAIT_NAME[best.axis].negative;
      reasons.push(`城市气质偏${persona}，与你的人格倾向同频`);
    }
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
  if (result.costFitScore != null && result.costFitScore >= 80) {
    reasons.push(`月生活成本 ${formatCost(city)}，与你的预算区间高度匹配`);
  }

  // 英语
  if (result.scores.english != null && result.scores.english >= 80) {
    reasons.push('英语友好度高，办事、就医与日常沟通门槛低');
  }

  // 签证
  if (result.scores.visa != null && result.scores.visa >= 80) {
    reasons.push('签证 / 居留路径灵活，适合反复进出或长期停留');
  }

  // 网络
  if (result.scores.internet != null && result.scores.internet >= 80) {
    reasons.push('网络基础设施出色，远程办公与视频会议稳定');
  }

  // 安全
  if (result.scores.safety != null && result.scores.safety >= 72) {
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
// 单城契合分（纯函数，供 assess 循环与城市对比页复用；返回未取整原始分）
// ---------------------------------------------------------------------------

export interface CityFits {
  personalityFit: number | null;
  preferenceFit: number | null;
  interestFit: number | null;
  fitValues: Record<string, number | null>;
}

export function computeCityFits(city: City, answers: UserAnswers): CityFits {
  const { traitVector } = derivePersonality(answers.mbti);
  const preferenceInputs = answers.lifestyle;

  // 人格契合：城市未标注 traits（新城无编辑分析依据）→ null 降权，不编造
  const personalityFit: number | null = city.traits
    ? (['EI', 'SN', 'TF', 'JP'] as AxisName[]).reduce((sum: number, axis) => {
        const key = axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp';
        const dist = Math.abs(traitVector[key] - city.traits![key]);
        return sum + clamp(100 - dist / 2, 0, 100);
      }, 0) / 4
    : null;

  const fitValues: Record<string, number | null> = {
    // 用户 8 维（lifestyle 答案驱动）
    budget: costFit(city, preferenceInputs.budget ?? ''),
    climate: climateFit(city, preferenceInputs.climate ?? 'any'),
    pace: ordinalFitNullable(ORDINAL_MAP.pace[preferenceInputs.pace ?? 'balanced'] ?? 3, city.pace),
    size: ordinalFitNullable(ORDINAL_MAP.size[preferenceInputs.size ?? 'mid'] ?? 3, city.size),
    social: ordinalFitNullable(ORDINAL_MAP.social[preferenceInputs.social ?? 'mid'] ?? 3, city.community),
    language: ordinalFitNullable(
      ORDINAL_MAP.language[preferenceInputs.language ?? 'basic'] ?? 3,
      city.english,
    ),
    visa: ordinalFitNullable(ORDINAL_MAP.visa[preferenceInputs.visa ?? 'mid'] ?? 3, city.visaScore),
    remote: ordinalFitNullable(ORDINAL_MAP.remote[preferenceInputs.remote ?? 'mid'] ?? 3, city.internet),
    // 客观 3 维（城市侧真实数据驱动）
    climateComfort: climateComfortFit(city.climateDetail),
    englishDepth: englishDepthFit(city),
    safety: safetyObjFit(city.safety),
  };

  // 偏好聚合：无数据维度按权重降权（从分子分母同时剔除，不惩罚）
  let num = 0;
  let den = 0;
  for (const k of PREFERENCE_KEYS) {
    const v = fitValues[k];
    if (v == null) continue;
    num += v * PREFERENCE_WEIGHTS[k];
    den += PREFERENCE_WEIGHTS[k];
  }
  const preferenceFit: number | null = den > 0 ? num / den : null;

  const interestFitScore = interestFit(answers.interests, city.tags);

  return { personalityFit, preferenceFit, interestFit: interestFitScore, fitValues };
}

// ---------------------------------------------------------------------------
// 主入口：计算整份报告
// ---------------------------------------------------------------------------

export function assess(answers: UserAnswers): AssessmentResult {
  const { typeCode, traitVector, axisScores } = derivePersonality(answers.mbti);

  const preferenceInputs = answers.lifestyle;

  const matches: CityMatch[] = cities.map((city: City) => {
    const fits = computeCityFits(city, answers);
    const { personalityFit, preferenceFit, interestFit: interestFitScore, fitValues } = fits;

    // 三大类聚合：城市缺某类数据时按类权重降权（30/48/22 名义权重不变）
    const classParts: [number | null, number][] = [
      [personalityFit, WEIGHTS.personality],
      [preferenceFit, WEIGHTS.preference],
      [interestFitScore, WEIGHTS.interest],
    ];
    let classNum = 0;
    let classDen = 0;
    for (const [v, w] of classParts) {
      if (v == null) continue;
      classNum += v * w;
      classDen += w;
    }
    const raw = classDen > 0 ? classNum / classDen : 0;

    // 校准到直观的匹配度区间（~66 – 97）
    const match = Math.round(clamp(52 + raw * 0.46, 0, 99));

    const round1 = (v: number | null): number | null => (v == null ? null : Math.round(v));
    const scores: DimensionScores = {
      cost: round1(fitValues.budget),
      internet: city.internet == null ? null : city.internet * 20,
      safety: city.safety == null ? null : Math.round(city.safety),
      community: city.community == null ? null : city.community * 20,
      english: city.english == null ? null : city.english * 20,
      visa: city.visaScore == null ? null : city.visaScore * 20,
    };

    const reasons = buildReasons(city, {
      traitVector,
      preferences: preferenceInputs,
      interests: answers.interests,
      scores,
      costFitScore: fitValues.budget,
    });

    const fitDetails: Record<string, number | null> = {};
    for (const k of PREFERENCE_KEYS) fitDetails[k] = round1(fitValues[k]);

    return {
      city,
      match,
      personalityFit: round1(personalityFit),
      preferenceFit: round1(preferenceFit),
      interestFit: round1(interestFitScore),
      fitDetails,
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
    axisScores,
    preferences: answers.lifestyle,
    interests: answers.interests,
    profileTags,
    matches: matches.slice(0, 5),
  };
}
