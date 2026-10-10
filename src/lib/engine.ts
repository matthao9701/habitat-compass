import type { City, CityTraitVector, PassportCode } from '../data/types';
import { cities } from '../data';
import { getCurrentLang, translate } from '../i18n';
import { tagLabel } from './format';
import {
  deriveRiasec,
  deriveRisk,
  tagRepeats,
  riasecBoostedTags,
  type RiasecProfile,
  type RiskProfile,
} from './riasec';
import type { Pole } from '../data/questions';
import { scenarioQuestions, lifestyleQuestions } from '../data/questions';
import {
  ipipPairs,
  proLifestyleQuestions,
  RANK_ORDINALS,
  IPIP_FACETS,
  type BigFiveDomain,
  type UserDimKey,
} from '../data/questionsPro';

// ---------------------------------------------------------------------------
// 用户答案与测评结果类型
// ---------------------------------------------------------------------------

/** 测评版本：lite = 简易版（免费），pro = 标准版（IPIP-NEO 120 题深度测评） */
export type QuizVersion = 'lite' | 'pro';

export type AxisName = 'EI' | 'SN' | 'TF' | 'JP';

export interface UserAnswers {
  /** 作答版本（派生字段，保留以兼容历史存档）：含深化段 = pro，仅核心段 = lite */
  version?: QuizVersion;
  /** 核心段人格：SJT 二元迫选场景题作答（'a' | 'b'，见 questions.ts） */
  mbti: Record<string, string>;
  /** 深度人格：IPIP 二元迫选配对作答（'a' | 'b'，见 questionsPro.ts）。存在即视为「深度版」，人格以它为准 */
  ipip?: Record<string, string>;
  /** 生活偏好作答：核心段 8 题单选；深化段另有滑杆/排序/二选一（见 questionsPro.ts） */
  lifestyle: Record<string, string>;
  /** 兴趣标签多选（核心段 16 个；深化段可扩到 28 个一级标签 id） */
  interests: string[];
  /** 深化段专有：二级细化子项选择（key = 一级标签 id），选中子项强化该兴趣权重 */
  interestSubs?: Record<string, string[]>;
  /** 深化段专有：RIASEC 六维题作答（O*NET IP-SF 30 题，1-5 喜好量表） */
  riasec?: Record<string, number>;
  /** 深化段专有：IPIP Risk-Taking 作答（10 题 1-5 量表） */
  risk?: Record<string, number>;
  /** 第九轮：护照/国籍（硬约束步骤选择，默认中国大陆；免签快照目前仅覆盖 CN） */
  passport?: PassportCode;
}

/**
 * 是否包含深化段（IPIP 人格已作答）。
 * 融合题库后不再由入口选择版本，改由「是否答了深化段」派生：
 * 有 IPIP 作答 → 深化版（BigFive / RIASEC / 风险 / 进阶偏好全部参与）；
 * 无 IPIP 作答 → 基础版（SJT 人格 + 核心偏好 + 核心兴趣）。
 */
export function isDeep(answers: UserAnswers): boolean {
  return !!answers.ipip && Object.keys(answers.ipip).length > 0;
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
  /** 硬约束放宽保留的超预算标记（constraints 层注入） */
  overBudget?: boolean;
  /** null = 城市缺该类数据，聚合时降权（不惩罚） */
  personalityFit: number | null;
  preferenceFit: number | null;
  interestFit: number | null;
  /** 引擎 v3 Tier 3 加分层分（0-100 取整；lite / 无 RIASEC 与风险信号时 null） */
  tier3Fit?: number | null;
  /** 11 个生活偏好维度的单项得分（0-100）；null = 城市该维度无数据（已降权） */
  fitDetails: Record<string, number | null>;
  scores: DimensionScores;
  reasons: string[];
}

export interface AssessmentResult {
  /** 测评版本（lite / pro） */
  version: QuizVersion;
  typeCode: string;
  /** 四个维度的位置：正为 E/N/F/P，负为 I/S/T/J（-100..100） */
  traitVector: CityTraitVector;
  /** 七级量表换算的偏好百分比（0-100，朝正向字母 E/N/F/P） */
  axisScores: Record<AxisName, number>;
  preferences: UserAnswers['lifestyle'];
  interests: string[];
  profileTags: string[];
  /** 展示用 Top 5（保持 slice(0,5)，兼容既有断言） */
  matches: CityMatch[];
  /** 全部参与城市的降序完整列表（报告「加权梯队」从完整池挑性价比/惊喜项） */
  allMatches?: CityMatch[];
  /** pro 专有：Big Five 完整剖面（五域百分位 + 30 facets） */
  proProfile?: BigFiveProfile;
  /** 第八轮 pro 专有：RIASEC 六维剖面（未作答时缺省） */
  riasecProfile?: RiasecProfile;
  /** 第八轮 pro 专有：风险偏好画像（未作答时缺省） */
  riskProfile?: RiskProfile;
  /** 第六轮：硬约束过滤摘要（未设置硬约束时缺省） */
  constraints?: {
    applied: boolean;
    relaxed: boolean;
    excludedCount: number;
    excluded: import('./constraints').ExcludedEntry[];
    overBudgetIds: string[];
    /** 第九轮：免签底线因所选护照无快照而降级不过滤 */
    passportSkipped: boolean;
  };
}

// ---------------------------------------------------------------------------
// Big Five（标准版人格）：IPIP-NEO 计分 → 30 facets → 5 域百分位 → 16 型映射
// ---------------------------------------------------------------------------

export interface BigFiveFacetScore {
  facet: string;
  facetZh: string;
  domain: BigFiveDomain;
  /** 0-100 百分位 */
  percentile: number;
}

export interface BigFiveProfile {
  /** 五大域百分位（0-100） */
  domains: Record<BigFiveDomain, number>;
  /** 30 个 facet 百分位 */
  facets: BigFiveFacetScore[];
  typeCode: string;
  traitVector: CityTraitVector;
  axisScores: Record<AxisName, number>;
}

// ---------------------------------------------------------------------------
// 常量与映射
// ---------------------------------------------------------------------------

const AXES = ['EI', 'SN', 'TF', 'JP'] as const;

const POLE_SIGN: Record<Pole, number> = {
  E: 1, I: -1, N: 1, S: -1, F: 1, T: -1, P: 1, J: -1,
};

/**
 * 引擎 v3 分层权重表（第十轮重构；设计依据见 DESIGN.md「引擎 v3 权重依据」）：
 *
 * Tier 1 硬约束过滤层（constraints.ts，语义不动）：
 *   预算 / 签证 / 安全 / 护照免签——打分前一票否决，不参与权重。
 *
 * Tier 2 核心匹配层（三大类，Σ = 0.90 = 1 - TIER3_TOTAL_SHARE）：
 *   保持 偏好 > 人格 > 兴趣 相对优先级（OECD Better Life「用户自定权重」方法论：
 *   用户直接作答、可控性最高的偏好类占主导；人格同频是长期满意度预测因子；
 *   兴趣标签稀疏（城市侧人工标注）适当降权以减少噪声）。
 *   城市缺某类数据时按权重降权（分子分母同时剔除，不惩罚）。
 */
export const TIER2_WEIGHTS = {
  preference: 0.42,
  personality: 0.3,
  interest: 0.18,
} as const;

/**
 * Tier 3 加分项层（Σ = 0.10，上限 ≤10%）：
 * - riasecBoost：RIASEC 强化标签与城市 tags 的加权重合率（第十轮起从兴趣类
 *   本体分中迁出，避免双重计入）
 * - riskLink：IPIP 风险指数 × 城市冒险友好度（adventureFriendly）距离联动
 * 两项任一存在才计入；全缺时整体回落 Tier 2（降权不惩罚）。
 */
export const TIER3_WEIGHTS = {
  riasecBoost: 0.05,
  riskLink: 0.03,
  airFit: 0.02,
} as const;

/** Tier 3 占总权重比例（= TIER3_WEIGHTS 合计，硬上限 10%） */
export const TIER3_TOTAL_SHARE = 0.1;

/**
 * 偏好类内「用户主观 vs 客观数据」分层（声明层，供校验与文档引用）：
 * 用户 8 维合计 0.86 / 客观 3 维合计 0.14（与 PREFERENCE_WEIGHTS 保持一致）。
 */
export const PREFERENCE_SPLIT = { user: 0.86, objective: 0.14 } as const;

/** 兼容别名：旧引用（compare 等）继续可用，值 = Tier 2 三大类权重 */
export const WEIGHTS = { personality: 0.3, preference: 0.42, interest: 0.18 };

/**
 * 偏好类内权重 v2（11 维，总和 = 1.0）：
 * - 用户维度（8，合计 0.86 = PREFERENCE_SPLIT.user）：来自生活方式测评题
 * - 客观维度（3，合计 0.14 = PREFERENCE_SPLIT.objective）：城市侧真实数据
 *   （气候舒适 / 治安安全 / 英语普及），在用户维度之上补充参考信号
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
  if (!city.cost) return translate(getCurrentLang(), 'cost.naLong');
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

/** 英语普及（客观）：公开英语能力排名官方评级 → 分值；缺评级回退 english 序数 × 20 */
const BAND_SCORE: Record<string, number> = {
  'very high': 95,
  high: 85,
  moderate: 72,
  low: 55,
  'very low': 40,
};

function englishDepthFit(city: City): number | null {
  if (city.englishBand) return BAND_SCORE[city.englishBand] ?? null;
  if (city.english != null) return city.english * 20;
  return null;
}

/** 治安（客观）：公开统计安全分（0-100）直接映射 */
function safetyObjFit(safety: number | null): number | null {
  if (safety == null) return null;
  return clamp(safety, 5, 100);
}

/**
 * 兴趣匹配（userTags 允许重复出现以实现二级子项权重强化）：
 * 精度（user 视角，70% 权重）+ 召回（city 视角，30% 权重，按去重交集计）。
 */
function interestFit(userTags: string[], cityTags: string[]): number | null {
  if (cityTags.length === 0) return null; // 城市无标签数据 → 兴趣维度降权，不编造
  if (userTags.length === 0) return 72;
  const matchedArr = userTags.filter((t) => cityTags.includes(t));
  const matchedUnique = new Set(matchedArr).size;
  const precision = (matchedArr.length / userTags.length) * 70;
  const recall = (matchedUnique / cityTags.length) * 30;
  return clamp(precision + recall, 0, 100);
}

/** 标准版标签权重强化：重复出现 = 权重加倍。信号源：二级子项 + RIASEC 高分维（叠加封顶 ×3，见 lib/riasec.ts） */
/**
 * 用户标签加权展开：勾选 1 次 = ×1；pro 的子项强化 +1；RIASEC 强化按 options 控制
 * （第十轮引擎 v3：兴趣类本体分不含 RIASEC 强化 → includeRiasec: false）。
 */
export function weightedUserTags(
  answers: UserAnswers,
  options?: { includeRiasec?: boolean },
): string[] {
  const base = answers.interests;
  if (!isDeep(answers)) return base;
  const repeats = tagRepeats(answers, options);
  if (repeats.size === 0) return base;
  const out = [...base];
  for (const [tag, n] of repeats) {
    for (let i = 0; i < n; i++) out.push(tag);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 人格（16 型，Jungian 传统四轴）
// ---------------------------------------------------------------------------

/**
 * 核心段人格计分（SJT 二元迫选场景题）：
 * 每轴 8 题，每题选 a 或 b，统计选中「正向字母」的次数 positiveCount；
 * axisScore = Math.round(positiveCount / 8 * 100)（按该轴实际题数归一）；
 * typeCode 各轴 axisScore >= 50 取正向字母（E/N/F/P），否则反向（I/S/T/J）；
 * traitVector = { ei, sn, tf, jp } = axisScore * 2 - 100。
 * 未作答项按 0.5（中性）计入。
 */
export function derivePersonality(mbtiAnswers: Record<string, string>): {
  typeCode: string;
  traitVector: CityTraitVector;
  axisScores: Record<AxisName, number>;
} {
  const positiveCount: Record<AxisName, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const totalCount: Record<AxisName, number> = { EI: 0, SN: 0, TF: 0, JP: 0 };

  for (const q of scenarioQuestions) {
    const answer = mbtiAnswers[q.id];
    totalCount[q.axis]++;

    if (answer === 'a') {
      // a 选项指向的极
      positiveCount[q.axis] += isPositivePole(q.a.pole, q.axis) ? 1 : 0;
    } else if (answer === 'b') {
      // b 选项指向的极
      positiveCount[q.axis] += isPositivePole(q.b.pole, q.axis) ? 1 : 0;
    } else {
      // 未作答按 0.5 中性计入
      positiveCount[q.axis] += 0.5;
    }
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
    // 每轴题数（默认 8）；分数 = 选中正向字母题数 / 题数 × 100
    const count = totalCount[axis] || 8;
    const score = Math.round((positiveCount[axis] / count) * 100);
    axisScores[axis] = score;
    vector[axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp'] = score * 2 - 100;
    letters.push(score >= 50 ? positiveLetter[axis][0] : positiveLetter[axis][1]);
  }

  return { typeCode: letters.join(''), traitVector: vector, axisScores };
}

/** 判断某极是否为该轴的正向字母 */
function isPositivePole(pole: Pole, axis: AxisName): boolean {
  const positivePoles: Record<AxisName, Pole> = {
    EI: 'E',
    SN: 'N',
    TF: 'F',
    JP: 'P',
  };
  return pole === positivePoles[axis];
}


// ---------------------------------------------------------------------------
// 深度人格：IPIP 二元迫选配对计分 → Big Five → 16 型映射（McCrae & Costa 对应）
// ---------------------------------------------------------------------------

const IPIP_FACET_PAIRS = new Map<string, typeof ipipPairs>();
for (const f of IPIP_FACETS) {
  IPIP_FACET_PAIRS.set(
    f.key,
    ipipPairs.filter((p) => p.facet === f.key),
  );
}

/**
 * 深度计分（二元迫选口径）：
 * 每 facet 由 2 组迫选对构成，A = 正向陈述、B = 反向陈述。
 * 选 A → 该对记 1（偏正向），选 B → 记 0；未作答对记 0.5（中性）。
 * facet 百分位 = 该 facet 全部对的均值 × 100（0 / 50 / 100 三档）。
 * 域分 = 6 facet 均值 → 16 型映射（中位 50 分界，恰为 50 归正向字母）：
 *   E/I ← Extraversion；S/N ← Openness（高开放 → N）；T/F ← Agreeableness（高宜人 → F）；
 *   J/P ← Conscientiousness（高尽责 → J）。Neuroticism 无对应字母，作为独立补充维度。
 * traitVector 对齐引擎语义（正 = E/N/F/P）：
 *   ei = (E-50)·2；sn = (O-50)·2；tf = (A-50)·2；jp = (50-C)·2。
 */
export function derivePersonalityPro(ipipAnswers: Record<string, string>): BigFiveProfile {
  const facetPct = new Map<string, number>();

  for (const f of IPIP_FACETS) {
    const pairs = IPIP_FACET_PAIRS.get(f.key) ?? [];
    if (pairs.length === 0) {
      facetPct.set(f.key, 50);
      continue;
    }
    let sum = 0;
    for (const p of pairs) {
      const raw = ipipAnswers[p.id];
      if (raw === 'a') sum += 1; // A = 正向陈述
      else if (raw === 'b') sum += 0; // B = 反向陈述
      else sum += 0.5; // 未作答按中值
    }
    facetPct.set(f.key, (sum / pairs.length) * 100);
  }

  const domainMean = (domain: BigFiveDomain): number => {
    const keys = IPIP_FACETS.filter((f) => f.domain === domain).map((f) => f.key);
    return keys.reduce((s, k) => s + (facetPct.get(k) ?? 50), 0) / keys.length;
  };

  const domains: Record<BigFiveDomain, number> = {
    E: domainMean('E'),
    A: domainMean('A'),
    C: domainMean('C'),
    N: domainMean('N'),
    O: domainMean('O'),
  };

  const letters = { E: domains.E >= 50 ? 'E' : 'I', N: domains.O >= 50 ? 'N' : 'S', F: domains.A >= 50 ? 'F' : 'T', J: domains.C >= 50 ? 'J' : 'P' };
  const typeCode = `${letters.E}${letters.N}${letters.F}${letters.J}`;

  const vector: CityTraitVector = {
    ei: Math.round((domains.E - 50) * 2),
    sn: Math.round((domains.O - 50) * 2),
    tf: Math.round((domains.A - 50) * 2),
    jp: Math.round((50 - domains.C) * 2),
  };
  const axisScores: Record<AxisName, number> = {
    EI: Math.round(domains.E),
    SN: Math.round(domains.O),
    TF: Math.round(domains.A),
    JP: 100 - Math.round(domains.C),
  };

  const facets: BigFiveFacetScore[] = IPIP_FACETS.map((f) => ({
    facet: f.key,
    facetZh: f.zh,
    domain: f.domain,
    percentile: Math.round(facetPct.get(f.key) ?? 50),
  }));

  return { domains, facets, typeCode, traitVector: vector, axisScores };
}

// ---------------------------------------------------------------------------
// 标准版生活偏好：20 题（4 题型）→ 6 个序数维（pace/size/social/language/visa/remote）
// ---------------------------------------------------------------------------

export type PreferenceOrdinals = Record<UserDimKey, number>;

const clamp15 = (v: number): number => Math.min(5, Math.max(1, v));

/**
 * 聚合生活偏好作答 → 每维 1-5 序数（多题均值，四舍五入到 0.1）。
 * 深度段 = 核心段 8 题（二元迫选经 ORDINAL_MAP）+ 深度段深化辨析题，两级信号叠加。
 * - 核心段 choice（pace/size/social/language/visa/remote）：由选项 value 经 ORDINAL_MAP 贡献
 * - 深度段 choice / forced：按选项 ordinalMap 贡献
 * - 深度段 slider：作答编码 'p1-p2-p3-p4'（与 dims 顺序一致，和 = total）→ 每维 1 + 4·pct
 * - 深度段 rank：作答编码 'a>b>c>d' → RANK_ORDINALS（5 / 3.5 / 2.5 / 1）
 * （budget / climate 不走序数维，由 costFit / climateFit 专用函数处理）
 */
export function derivePreferenceOrdinals(lifestyle: Record<string, string>): PreferenceOrdinals {
  const sums: Record<UserDimKey, { sum: number; count: number }> = {
    pace: { sum: 0, count: 0 },
    size: { sum: 0, count: 0 },
    social: { sum: 0, count: 0 },
    language: { sum: 0, count: 0 },
    visa: { sum: 0, count: 0 },
    remote: { sum: 0, count: 0 },
  };

  const add = (key: UserDimKey, v: number): void => {
    sums[key].sum += clamp15(v);
    sums[key].count += 1;
  };

  // 1) 核心段 8 题：6 个序数维由二元迫选选项经 ORDINAL_MAP 映射
  for (const q of lifestyleQuestions) {
    const raw = lifestyle[q.id];
    if (!raw) continue;
    const mapped = ORDINAL_MAP[q.id]?.[raw];
    if (typeof mapped === 'number') add(q.id as UserDimKey, mapped);
  }

  // 2) 深度段深化辨析题：追加贡献
  for (const q of proLifestyleQuestions) {
    const raw = lifestyle[q.id];
    if (!raw) continue;
    const contrib: Partial<Record<UserDimKey, number>> = {};

    if (q.kind === 'choice' || q.kind === 'forced') {
      Object.assign(contrib, q.ordinalMap[raw] ?? {});
    } else if (q.kind === 'slider') {
      const parts = raw.split('-').map(Number);
      q.dims.forEach((d, i) => {
        const p = parts[i];
        if (Number.isFinite(p) && p >= 0) contrib[d.key] = 1 + (p / q.total) * 4;
      });
    } else {
      const order = raw.split('>');
      q.items.forEach((it) => {
        const pos = order.indexOf(it.value);
        if (pos >= 0 && pos < RANK_ORDINALS.length) contrib[it.value] = RANK_ORDINALS[pos];
      });
    }

    for (const [k, v] of Object.entries(contrib)) {
      const key = k as UserDimKey;
      if (typeof v !== 'number') continue;
      add(key, v);
    }
  }

  const round1 = (v: number): number => Math.round(v * 10) / 10;
  return {
    pace: sums.pace.count ? round1(sums.pace.sum / sums.pace.count) : 3,
    size: sums.size.count ? round1(sums.size.sum / sums.size.count) : 3,
    social: sums.social.count ? round1(sums.social.sum / sums.social.count) : 3,
    language: sums.language.count ? round1(sums.language.sum / sums.language.count) : 3,
    visa: sums.visa.count ? round1(sums.visa.sum / sums.visa.count) : 3,
    remote: sums.remote.count ? round1(sums.remote.sum / sums.remote.count) : 3,
  };
}

/**
 * 人格计算（融合题库统一口径）：
 * - 深化段已作答（answers.ipip）→ 以 IPIP-NEO 计分为准，附 Big Five 剖面；
 * - 否则 → SJT 二元迫选情境题计分。
 */
export function getPersonality(answers: UserAnswers): {
  typeCode: string;
  traitVector: CityTraitVector;
  axisScores: Record<AxisName, number>;
  proProfile?: BigFiveProfile;
} {
  if (isDeep(answers)) {
    const profile = derivePersonalityPro(answers.ipip ?? {});
    return {
      typeCode: profile.typeCode,
      traitVector: profile.traitVector,
      axisScores: profile.axisScores,
      proProfile: profile,
    };
  }
  return derivePersonality(answers.mbti);
}

// ---------------------------------------------------------------------------
// 推荐理由生成
// ---------------------------------------------------------------------------

const TRAIT_NAME: Record<AxisName, { positive: string; negative: string }> = {
  EI: { positive: 'rep.trait.EI.pos', negative: 'rep.trait.EI.neg' },
  SN: { positive: 'rep.trait.SN.pos', negative: 'rep.trait.SN.neg' },
  TF: { positive: 'rep.trait.TF.pos', negative: 'rep.trait.TF.neg' },
  JP: { positive: 'rep.trait.JP.pos', negative: 'rep.trait.JP.neg' },
};

/** 规则层本地化：当前语言词典查找（zh 回中文原文，en 输出英文） */
const tr = (key: string, vars?: Record<string, string | number>): string =>
  translate(getCurrentLang(), key, vars);

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
      const personaKey = cityIsPositive
        ? TRAIT_NAME[best.axis].positive
        : TRAIT_NAME[best.axis].negative;
      reasons.push(tr('rep.reason.persona', { persona: tr(personaKey) }));
    }
  }

  // 兴趣重合
  const matchedInterests = result.interests.filter((t) => city.tags.includes(t));
  if (matchedInterests.length > 0) {
    const labels = matchedInterests
      .slice(0, 3)
      .map((t) => tagLabel(t))
      .join('、');
    reasons.push(tr('rep.reason.interests', { labels }));
  }

  // 预算
  if (result.costFitScore != null && result.costFitScore >= 80) {
    reasons.push(tr('rep.reason.budget', { cost: formatCost(city) }));
  }

  // 英语
  if (result.scores.english != null && result.scores.english >= 80) {
    reasons.push(tr('rep.reason.english'));
  }

  // 签证
  if (result.scores.visa != null && result.scores.visa >= 80) {
    reasons.push(tr('rep.reason.visa'));
  }

  // 网络
  if (result.scores.internet != null && result.scores.internet >= 80) {
    reasons.push(tr('rep.reason.network'));
  }

  // 安全
  if (result.scores.safety != null && result.scores.safety >= 72) {
    reasons.push(tr('rep.reason.safety', { n: city.safety ?? '' }));
  }

  // 兜底
  if (reasons.length === 0) {
    reasons.push(tr('rep.reason.balanced'));
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
  version?: QuizVersion;
}): string[] {
  const tags: string[] = [result.typeCode];
  for (const q of lifestyleQuestions) {
    const value = result.preferences[q.id];
    const option = q.options.find((o) => o.value === value);
    if (option) {
      // Use translation key if available, otherwise fall back to label
      const key = `ls.${q.id}.opt.${value}.label`;
      tags.push(tr(key, {}));
    }
  }
  for (const id of result.interests.slice(0, 6)) {
    tags.push(tagLabel(id));
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
  /** Tier 3：RIASEC 强化标签 × 城市 tags 加权重合率（0-100，无强化信号为 null） */
  riasecFit?: number | null;
  /** Tier 3：风险指数 × 城市冒险友好度距离联动（0-100，任一侧缺失为 null） */
  riskFit?: number | null;
  /** Tier 3：空气质量分档映射分（0-100，城市无 airQuality 数据为 null） */
  airFit?: number | null;
  fitValues: Record<string, number | null>;
}

export function computeCityFits(city: City, answers: UserAnswers): CityFits {
  const { traitVector } = getPersonality(answers);
  const preferenceInputs = answers.lifestyle;
  const isPro = isDeep(answers);

  // 标准版：20 题聚合出 6 个序数维；budget/climate 仍走槽位题（P5/P6）
  const prefOrd = isPro ? derivePreferenceOrdinals(preferenceInputs) : null;

  // 人格契合：城市未标注 traits（新城无编辑分析依据）→ null 降权，不编造
  const personalityFit: number | null = city.traits
    ? (['EI', 'SN', 'TF', 'JP'] as AxisName[]).reduce((sum: number, axis) => {
        const key = axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp';
        const dist = Math.abs(traitVector[key] - city.traits![key]);
        return sum + clamp(100 - dist / 2, 0, 100);
      }, 0) / 4
    : null;

  const fitValues: Record<string, number | null> = {
    // 用户 8 维（lifestyle 答案驱动；pro 的 6 个序数维来自多题聚合）
    budget: costFit(city, preferenceInputs.budget ?? ''),
    climate: climateFit(city, preferenceInputs.climate ?? 'any'),
    pace: ordinalFitNullable(
      prefOrd ? prefOrd.pace : ORDINAL_MAP.pace[preferenceInputs.pace ?? 'balanced'] ?? 3,
      city.pace,
    ),
    size: ordinalFitNullable(
      prefOrd ? prefOrd.size : ORDINAL_MAP.size[preferenceInputs.size ?? 'mid'] ?? 3,
      city.size,
    ),
    social: ordinalFitNullable(
      prefOrd ? prefOrd.social : ORDINAL_MAP.social[preferenceInputs.social ?? 'mid'] ?? 3,
      city.community,
    ),
    language: ordinalFitNullable(
      prefOrd ? prefOrd.language : ORDINAL_MAP.language[preferenceInputs.language ?? 'basic'] ?? 3,
      city.english,
    ),
    visa: ordinalFitNullable(
      prefOrd ? prefOrd.visa : ORDINAL_MAP.visa[preferenceInputs.visa ?? 'mid'] ?? 3,
      city.visaScore,
    ),
    remote: ordinalFitNullable(
      prefOrd ? prefOrd.remote : ORDINAL_MAP.remote[preferenceInputs.remote ?? 'mid'] ?? 3,
      city.internet,
    ),
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

  // 兴趣类本体分：仅用户勾选 + 子项强化（第十轮起 RIASEC 强化迁出至 Tier 3）
  const interestFitScore = interestFit(weightedUserTags(answers, { includeRiasec: false }), city.tags);

  // ---- Tier 3 加分项 ----
  // riasecBoost：RIASEC 高分维强化的已选标签与城市 tags 的加权重合率
  let riasecFit: number | null = null;
  if (answers.riasec) {
    const boosted = riasecBoostedTags(answers);
    const totalW = [...boosted.values()].reduce((s, n) => s + n, 0);
    if (totalW > 0 && city.tags.length > 0) {
      const hit = [...boosted.entries()].reduce((s, [tag, w]) => s + (city.tags.includes(tag) ? w : 0), 0);
      riasecFit = (hit / totalW) * 100;
    }
  }
  // riskLink：用户风险指数与城市冒险友好度的距离联动
  const riskFit = riskLinkFit(city, answers);
  // airFit：WHO 分档映射（优 90 / 良 72 / 一般 48 / 差 25）——Tier 3 仅标准版消费（简易版 tier3Fit 保持 null），城市无数据 → null
  const AIR_BAND_SCORE: Record<string, number> = { good: 90, fair: 72, moderate: 48, poor: 25 };
  const airFit = isPro && city.airQuality ? AIR_BAND_SCORE[city.airQuality.band] ?? null : null;

  return { personalityFit, preferenceFit, interestFit: interestFitScore, riasecFit, riskFit, airFit, fitValues };
}

/**
 * 城市「冒险友好度」0-100（Tier 3 派生，非引擎主分）：
 * 安全底盘 0.40 + 签证灵活 0.30（数字游民签证 true=100，否则 visaScore×20）
 * + 夜生活标签 0.20 + 户外/冒险标签覆盖 0.10；分量缺失时剔除重归一（降权不惩罚）。
 */
export function adventureFriendly(city: City): number | null {
  const parts: [number, number][] = [];
  if (city.safety != null) parts.push([city.safety, 0.4]);
  const visaFlex =
    city.digitalNomadVisa === true
      ? 100
      : city.visaScore != null
        ? clamp(city.visaScore * 20, 0, 100)
        : null;
  if (visaFlex != null) parts.push([visaFlex, 0.3]);
  if (city.tags.length > 0) {
    const tagSet = new Set(city.tags);
    parts.push([tagSet.has('nightlife') ? 100 : 0, 0.2]);
    const outdoorTags = ['outdoor', 'adventure-sports', 'watersports', 'skiing', 'nature'];
    const hits = outdoorTags.filter((t) => tagSet.has(t)).length;
    parts.push([(hits / outdoorTags.length) * 100, 0.1]);
  }
  const den = parts.reduce((s, [, w]) => s + w, 0);
  if (den <= 0) return null;
  return parts.reduce((s, [v, w]) => s + v * w, 0) / den;
}

/** Tier 3 风险联动：|风险指数 - 冒险友好度| 距离相似度（0-100），任一侧缺失 → null */
export function riskLinkFit(city: City, answers: UserAnswers): number | null {
  const risk = answers.risk ? deriveRisk(answers.risk) : null;
  if (!risk) return null;
  const af = adventureFriendly(city);
  if (af == null) return null;
  return clamp(100 - Math.abs(risk.score - af), 0, 100);
}

export interface V3Fits {
  personalityFit: number | null;
  preferenceFit: number | null;
  interestFit: number | null;
  riasecFit?: number | null;
  riskFit?: number | null;
  airFit?: number | null;
}

/**
 * 引擎 v3 分层聚合（assess 与对比页临时权重重算共用，保证口径一致）：
 * Tier 2 三大类 null 降权归一 → tier2Raw；
 * Tier 3 两项任一存在才计入：raw = tier2Raw × 0.9 + tier3Raw × 0.1；
 * Tier 3 全缺 → raw = tier2Raw（降权不惩罚，简易版自动回落）。
 */
export function aggregateV3Raw(f: V3Fits): number {
  const t2Parts: [number | null, number][] = [
    [f.personalityFit, TIER2_WEIGHTS.personality],
    [f.preferenceFit, TIER2_WEIGHTS.preference],
    [f.interestFit, TIER2_WEIGHTS.interest],
  ];
  let num = 0;
  let den = 0;
  for (const [v, w] of t2Parts) {
    if (v == null) continue;
    num += v * w;
    den += w;
  }
  const tier2Raw = den > 0 ? num / den : 0;

  const t3Parts: [number | null, number][] = [
    [f.riasecFit ?? null, TIER3_WEIGHTS.riasecBoost],
    [f.riskFit ?? null, TIER3_WEIGHTS.riskLink],
    [f.airFit ?? null, TIER3_WEIGHTS.airFit],
  ];
  let t3n = 0;
  let t3d = 0;
  for (const [v, w] of t3Parts) {
    if (v == null) continue;
    t3n += v * w;
    t3d += w;
  }
  if (t3d <= 0) return tier2Raw;
  const tier3Raw = t3n / t3d;
  return tier2Raw * (1 - TIER3_TOTAL_SHARE) + tier3Raw * TIER3_TOTAL_SHARE;
}

// ---------------------------------------------------------------------------
// 主入口：计算整份报告
// ---------------------------------------------------------------------------

export function assess(answers: UserAnswers, cityPool?: City[]): AssessmentResult {
  const personality = getPersonality(answers);
  const { typeCode, traitVector, axisScores } = personality;

  const preferenceInputs = answers.lifestyle;

  const matches: CityMatch[] = (cityPool ?? cities).map((city: City) => {
    const fits = computeCityFits(city, answers);
    const { personalityFit, preferenceFit, interestFit: interestFitScore, fitValues } = fits;

    // 引擎 v3 分层聚合：Tier 2（null 类降权）+ Tier 3 加分（≤10%，全缺回落）
    const riasecFit = fits.riasecFit ?? null;
    const riskFit = fits.riskFit ?? null;
    const raw = aggregateV3Raw({
      personalityFit,
      preferenceFit,
      interestFit: interestFitScore,
      riasecFit,
      riskFit,
    });
    // Tier 3 加分层独立分（仅展示口径：三信号按 TIER3_WEIGHTS 归一）
    const t3Parts: [number | null, number][] = [
      [riasecFit, TIER3_WEIGHTS.riasecBoost],
      [riskFit, TIER3_WEIGHTS.riskLink],
      [fits.airFit ?? null, TIER3_WEIGHTS.airFit],
    ];
    let t3n = 0;
    let t3d = 0;
    for (const [v, w] of t3Parts) {
      if (v == null) continue;
      t3n += v * w;
      t3d += w;
    }
    const tier3Fit = t3d > 0 ? t3n / t3d : null;

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
      tier3Fit: round1(tier3Fit),
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
    version: answers.version,
  });

  const deep = isDeep(answers);

  return {
    version: deep ? 'pro' : 'lite',
    typeCode,
    traitVector,
    axisScores,
    preferences: answers.lifestyle,
    interests: answers.interests,
    profileTags,
    matches: matches.slice(0, 5),
    allMatches: matches,
    proProfile: personality.proProfile,
    ...(deep && answers.riasec
      ? { riasecProfile: deriveRiasec(answers.riasec) }
      : {}),
    ...(deep && answers.risk
      ? { riskProfile: deriveRisk(answers.risk) ?? undefined }
      : {}),
  };
}
