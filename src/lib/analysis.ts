// ABOUTME: 报告页增强模块的规则分析层
// ABOUTME: 全部为纯函数规则模板——输入来自城市库真实字段与引擎计算结果，不调用外部 LLM

import type { AxisName } from './engine';
import type { City, CityTraitVector } from '../data/types';
import { getCurrentLang, translate } from '../i18n';
import { cityName, climateSummary } from './format';
import { visaLabelText } from '../i18n/countryGlossary';

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

/** 规则层本地化：当前语言词典查找（zh 回中文原文，en 输出英文）。
 *  变量允许 null/undefined（规则成立时才会被渲染，此处仅为放宽类型）。 */
const L = (key: string, vars?: Record<string, string | number | null | undefined>): string =>
  translate(getCurrentLang(), key, vars as Record<string, string | number> | undefined);

// ---------------------------------------------------------------------------
// 兴趣六大类（覆盖全部 16 个标签，与城市 tags 同 id）
// ---------------------------------------------------------------------------

export const INTEREST_CATEGORIES: { id: string; label: string; tags: string[] }[] = [
  { id: 'outdoor', label: '户外探索', tags: ['outdoor', 'watersports', 'nature', 'beach'] },
  { id: 'food', label: '美食咖啡', tags: ['food', 'coffee'] },
  { id: 'culture', label: '艺术文化', tags: ['arts', 'history', 'festivals'] },
  { id: 'urban', label: '都市夜生活', tags: ['nightlife', 'shopping', 'lgbtq'] },
  { id: 'wellness', label: '身心生活', tags: ['fitness', 'wellness', 'pets'] },
  { id: 'work', label: '创业社群', tags: ['startup'] },
];

export interface InterestCategoryScore {
  id: string;
  label: string;
  /** null = 用户未选择该类兴趣 */
  score: number | null;
  selectedCount: number;
  cityCount: number;
}

/**
 * 六类兴趣与城市的匹配度：与引擎同口径（精度 70% + 召回 30%），
 * 召回在类内归一化。用户未选择该类时返回 null。
 */
export function interestBreakdown(userTags: string[], cityTags: string[]): InterestCategoryScore[] {
  return INTEREST_CATEGORIES.map((cat) => {
    const userInCat = cat.tags.filter((t) => userTags.includes(t));
    const cityInCat = cat.tags.filter((t) => cityTags.includes(t));
    if (userInCat.length === 0) {
      return { id: cat.id, label: cat.label, score: null, selectedCount: 0, cityCount: cityInCat.length };
    }
    const matched = userInCat.filter((t) => cityTags.includes(t)).length;
    const precision = (matched / userInCat.length) * 70;
    const recall = cityInCat.length > 0 ? (matched / cityInCat.length) * 30 : 0;
    return {
      id: cat.id,
      label: cat.label,
      score: Math.round(clamp(precision + recall, 0, 100)),
      selectedCount: userInCat.length,
      cityCount: cityInCat.length,
    };
  });
}

// ---------------------------------------------------------------------------
// 生活偏好细分（11 维单项得分，来自引擎 fitDetails；null = 城市无数据已降权）
// ---------------------------------------------------------------------------

export const PREFERENCE_DIMENSIONS: { key: string; label: string; desc: string; objective?: boolean }[] = [
  { key: 'budget', label: '居住成本', desc: '月预算 × 城市成本区间' },
  { key: 'climate', label: '气候环境', desc: '偏好气候 × 城市气候类型' },
  { key: 'climateComfort', label: '气候舒适', desc: '年均温 / 降水 / 日照客观舒适带', objective: true },
  { key: 'pace', label: '生活节奏', desc: '节奏偏好 × 城市节奏' },
  { key: 'size', label: '城市规模', desc: '规模偏好 × 城市体量' },
  { key: 'social', label: '社交氛围', desc: '社交偏好 × 游民社区规模' },
  { key: 'language', label: '英语友好', desc: '语言需求 × 城市英语度' },
  { key: 'englishDepth', label: '英语普及', desc: '公开英语排名分档与英语环境', objective: true },
  { key: 'visa', label: '签证便利', desc: '签证诉求 × 签证灵活度' },
  { key: 'safety', label: '治安安全', desc: '公开统计测算 · 客观安全分', objective: true },
  { key: 'remote', label: '远程办公', desc: '办公条件 × 网络质量' },
];

export interface PreferenceDimScore {
  key: string;
  label: string;
  desc: string;
  score: number | null;
}

export function preferenceBreakdown(fitDetails: Record<string, number | null>): PreferenceDimScore[] {
  return PREFERENCE_DIMENSIONS.map((d) => ({
    key: d.key,
    label: d.label,
    desc: d.desc,
    score: fitDetails[d.key] ?? null,
  })).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

// ---------------------------------------------------------------------------
// 城市优势 / 注意事项（规则从真实字段提取）
// ---------------------------------------------------------------------------

/** 优势项：按规则优先级取前 3 条，全部基于城市库真实数据（null 字段自动跳过） */
export function cityPros(city: City): string[] {
  const pros: string[] = [];
  const push = (cond: boolean, text: string): void => {
    if (cond && pros.length < 3) pros.push(text);
  };
  const has = (v: number | null | undefined): v is number => v != null;

  push(has(city.internetMbps) && city.internetMbps >= 120, L('an.pro.netFast', { n: city.internetMbps }));
  push(city.digitalNomadVisa === true, L('an.pro.visa'));
  push(has(city.safety) && city.safety >= 75, L('an.pro.safetyHigh', { n: city.safety }));
  push(has(city.healthcareIndex) && city.healthcareIndex >= 75, L('an.pro.healthcare', { n: city.healthcareIndex }));
  push(has(city.community) && city.community >= 4, L('an.pro.community', { n: city.community }));
  push(has(city.english) && city.english >= 4, L('an.pro.english'));
  push(has(city.livingScore) && city.livingScore <= 38, L('an.pro.costLow', { n: city.livingScore }));
  push(
    city.climate === 'mediterranean' && has(city.tempC) && city.tempC <= 23,
    L('an.pro.mediterranean', { n: city.tempC }),
  );
  push(
    city.climate === 'tropical' || city.climate === 'subtropical',
    has(city.tempC) ? L('an.pro.warm', { n: city.tempC }) : L('an.pro.warmNoTemp'),
  );
  push(city.climate === 'desert', has(city.tempC) ? L('an.pro.desert', { n: city.tempC }) : L('an.pro.desertNoTemp'));
  push(has(city.internetMbps) && city.internetMbps >= 90, L('an.pro.netGood', { n: city.internetMbps }));
  push(has(city.safety) && city.safety >= 65 && city.safety < 75, L('an.pro.safetyMid', { n: city.safety }));
  push(has(city.community) && city.community >= 3 && city.community < 4, L('an.pro.communityMid', { n: city.community }));
  push(
    has(city.tempC) && city.tempC >= 12 && city.tempC <= 26,
    L('an.pro.tempMild', { n: city.tempC }),
  );
  const sun = city.climateDetail?.sunshineHours;
  push(sun != null && sun >= 2500, L('an.pro.sunny', { n: sun }));
  return pros.slice(0, 3);
}

/** 注意事项：按规则优先级取前 2 条；不足时以真实字段的通用提示兜底，不编造 */
export function cityCons(city: City): string[] {
  const cons: string[] = [];
  const push = (cond: boolean, text: string): void => {
    if (cond && cons.length < 2) cons.push(text);
  };
  const has = (v: number | null | undefined): v is number => v != null;
  const money = (v: number | null): string => (has(v) ? `$${v.toLocaleString('en-US')}` : '—');

  push(city.digitalNomadVisa === false, L('an.con.visaNone'));
  push(has(city.english) && city.english <= 2, L('an.con.noEnglish'));
  push(
    has(city.internetMbps) && city.internetMbps < 80,
    L('an.con.netSlow', { n: city.internetMbps }),
  );
  push(has(city.safety) && city.safety < 62, L('an.con.safetyLow', { n: city.safety }));
  push(
    has(city.livingScore) && city.livingScore >= 50,
    L('an.con.costMid', { n: city.livingScore }),
  );
  push(has(city.tempC) && city.tempC >= 23.5, L('an.con.hot', { n: city.tempC }));
  push(
    has(city.monthlyCostUSD) && city.monthlyCostUSD >= 1800,
    L('an.con.costHigh', { n: money(city.monthlyCostUSD) }),
  );
  push(has(city.community) && city.community <= 2, L('an.con.communitySmall', { n: city.community }));
  push(has(city.pace) && city.pace >= 4, L('an.con.paceFast'));
  const precip = city.climateDetail?.annualPrecipMm;
  push(precip != null && precip >= 1600, L('an.con.rainy', { n: precip }));

  // 兜底：仍不足 2 条时，用真实字段的通用提示补齐
  if (cons.length < 2 && city.climate) {
    const climateLabel = L(`climate.type.${city.climate}`);
    push(
      true,
      has(city.tempC)
        ? L('an.con.climateType', { label: climateLabel, t: city.tempC })
        : L('an.con.climateTypeNoTemp', { label: climateLabel }),
    );
  }
  if (cons.length < 2 && city.visaStatus == null) {
    push(true, L('an.con.visaPending'));
  }
  if (cons.length < 2) {
    push(true, L('an.con.visaVolatile'));
  }
  return cons.slice(0, 2);
}

// ---------------------------------------------------------------------------
// 定居建议徽标（规则透明：仅由匹配分决定）
// ---------------------------------------------------------------------------

export type BadgeLevel = 'good' | 'mid' | 'low';

export interface SettlementBadge {
  level: BadgeLevel;
  label: string;
  hint: string;
}

export function settlementBadge(match: number): SettlementBadge {
  if (match >= 60) {
    return { level: 'good', label: L('an.badge.long.label'), hint: L('an.badge.long.rule') };
  }
  if (match >= 50) {
    return { level: 'mid', label: L('an.badge.trial.label'), hint: L('an.badge.trial.rule') };
  }
  return { level: 'low', label: L('an.badge.short.label'), hint: L('an.badge.short.rule') };
}

// ---------------------------------------------------------------------------
// 人格 × 城市定性分析（Top1 专用，规则模板生成）
// ---------------------------------------------------------------------------

export interface PersonalityCityAnalysis {
  ideal: string[];
  factors: string[];
  challenges: string[];
}

const AXIS_TRAIT: Record<AxisName, { posLetter: string; negLetter: string; env: { pos: string; neg: string } }> = {
  EI: {
    posLetter: 'E',
    negLetter: 'I',
    env: { pos: 'an.env.EI.pos', neg: 'an.env.EI.neg' },
  },
  SN: {
    posLetter: 'N',
    negLetter: 'S',
    env: { pos: 'an.env.SN.pos', neg: 'an.env.SN.neg' },
  },
  TF: {
    posLetter: 'F',
    negLetter: 'T',
    env: { pos: 'an.env.TF.pos', neg: 'an.env.TF.neg' },
  },
  JP: {
    posLetter: 'P',
    negLetter: 'J',
    env: { pos: 'an.env.JP.pos', neg: 'an.env.JP.neg' },
  },
};

export function personalityCityAnalysis(
  axisScores: Record<AxisName, number>,
  traitVector: CityTraitVector | null,
  city: City,
  fitDetails: Record<string, number | null>,
): PersonalityCityAnalysis {
  // 理想环境特征：按四轴主导字母取 2 条最强倾向
  const axes: AxisName[] = ['EI', 'SN', 'TF', 'JP'];
  const sorted = [...axes].sort(
    (a, b) => Math.abs(axisScores[b] - 50) - Math.abs(axisScores[a] - 50),
  );
  const ideal = sorted.slice(0, 2).map((axis) => {
    const positive = axisScores[axis] >= 50;
    return L(AXIS_TRAIT[axis].env[positive ? 'pos' : 'neg']);
  });

  // 关键匹配因素：四轴同向且强度足够的轴 + 偏好契合最高的两个维度
  const factors: string[] = [];
  const aligned =
    city.traits && traitVector
      ? axes.filter((axis) => {
          const key = axis.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp';
          return (
            traitVector[key] * city.traits![key] > 0 &&
            Math.min(Math.abs(traitVector[key]), Math.abs(city.traits![key])) >= 25
          );
        })
      : [];
  if (aligned.length > 0 && traitVector) {
    const first = aligned[0];
    const key = first.toLowerCase() as 'ei' | 'sn' | 'tf' | 'jp';
    const letter = traitVector[key] > 0 ? AXIS_TRAIT[first].posLetter : AXIS_TRAIT[first].negLetter;
    factors.push(L('an.factor.resonance', { letter, n: axisScores[first] }));
  }
  const topDims = Object.entries(fitDetails)
    .filter(([, v]) => v != null)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 2);
  for (const [dimKey, score] of topDims) {
    const dim = PREFERENCE_DIMENSIONS.find((d) => d.key === dimKey);
    if (dim) factors.push(L('an.factor.dimTop', { dim: L(`an.dim.${dimKey}`), score: score as number, rule: L(`an.dim.${dimKey}.desc`) }));
  }
  if (factors.length === 0) {
    factors.push(L('an.factor.balanced'));
  }

  // 潜在挑战：规则命中即提示，最多 2 条；无张力时如实说明
  const challenges: string[] = [];
  if (axisScores.EI <= 45) {
    challenges.push(L('an.challenge.introvert'));
  }
  if (axisScores.JP <= 45 && (city.pace ?? 3) >= 4) {
    challenges.push(L('an.challenge.paceJ'));
  }
  if (axisScores.EI >= 55 && (city.community ?? 3) <= 2) {
    challenges.push(L('an.challenge.smallCommunity'));
  }
  if (axisScores.SN <= 45 && (city.size ?? 3) <= 2) {
    challenges.push(L('an.challenge.smallCity'));
  }
  if (axisScores.SN >= 55 && city.tags.filter((t) => ['arts', 'history', 'festivals'].includes(t)).length === 0) {
    challenges.push(L('an.challenge.fewTags'));
  }
  if (axisScores.TF >= 55 && (city.safety ?? 65) < 62) {
    challenges.push(L('an.challenge.safety'));
  }
  if (challenges.length === 0) {
    challenges.push(L('an.challenge.none'));
  }

  return { ideal, factors, challenges };
}

// ---------------------------------------------------------------------------
// 试住行动计划（Top1 专用，条目从真实数据生成）
// ---------------------------------------------------------------------------

export interface TrialChecklistGroup {
  title: string;
  items: string[];
}

export interface TrialPlan {
  days: string;
  /** 用于折算试住预算的天数中值 */
  daysMid: number;
  intro: string;
  checklist: TrialChecklistGroup[];
}

export function trialPlan(match: number, city: City): TrialPlan {
  const days = match >= 60 ? L('an.trial.days1') : match >= 50 ? L('an.trial.days2') : L('an.trial.days3');
  const daysMid = match >= 60 ? 17.5 : match >= 50 ? 25 : 30;
  const has = (v: number | null | undefined): v is number => v != null;
  const budget = has(city.monthlyCostUSD) ? Math.round((city.monthlyCostUSD / 30) * daysMid) : null;

  const intro = L('an.trial.intro', { city: cityName(city), days });

  const climateItem = city.climateDetail
    ? L('an.trial.climate.detail', {
        summary: climateSummary(city.climateDetail),
        t: city.climateDetail.avgTempC,
        p: city.climateDetail.annualPrecipMm,
        s: city.climateDetail.sunshineHours,
      })
    : city.climate
      ? L('an.trial.climate.simple', { label: L(`climate.type.${city.climate}`), t: city.tempC })
      : L('an.trial.climate.none');
  const budgetItem = budget
    ? L('an.trial.budget', { usd: city.monthlyCostUSD!.toLocaleString('en-US'), budget: `$${budget.toLocaleString('en-US')}` })
    : L('an.trial.budget.none');
  const livingScoreItem = has(city.livingScore)
    ? L('an.trial.cost.detail', { n: city.livingScore })
    : L('an.trial.cost.none');
  const rentItem = has(city.housingLevel)
    ? L('an.trial.rent', { n: city.housingLevel!.toLocaleString('en-US') })
    : L('an.trial.rent.none');

  const checklist: TrialChecklistGroup[] = [
    {
      title: L('an.trial.group.climate'),
      items: [
        climateItem,
        L('an.trial.climate.walk'),
      ],
    },
    {
      title: L('an.trial.group.cost'),
      items: [
        budgetItem,
        livingScoreItem,
        rentItem,
      ],
    },
    {
      title: L('an.trial.group.work'),
      items: [
        has(city.internetMbps)
          ? L('an.trial.net', { n: city.internetMbps })
          : L('an.trial.net.none'),
        city.digitalNomadVisa === true && city.visaLabel
          ? L('an.trial.visa.label', { visa: visaLabelText(city.visaLabel) })
          : city.visaLabel
            ? L('an.trial.visa.none', { visa: visaLabelText(city.visaLabel) })
            : L('an.trial.visa.pending'),
        L('an.trial.meetup'),
      ],
    },
  ];

  return { days, daysMid, intro, checklist };
}
