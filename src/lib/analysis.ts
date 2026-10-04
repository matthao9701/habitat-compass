// ABOUTME: 报告页增强模块的规则分析层
// ABOUTME: 全部为纯函数规则模板——输入来自城市库真实字段与引擎计算结果，不调用外部 LLM

import type { AxisName } from './engine';
import { CLIMATE_LABEL } from './engine';
import type { City, CityTraitVector } from '../data/types';

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

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
  { key: 'englishDepth', label: '英语普及', desc: 'EF EPI 评级与英语环境', objective: true },
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

  push(has(city.internetMbps) && city.internetMbps >= 120, `网络速度快（固定宽带中位 ${city.internetMbps} Mbps）`);
  push(city.digitalNomadVisa === true, '提供数字游民签证，远程停留路径清晰');
  push(has(city.safety) && city.safety >= 75, `治安良好（安全指数 ${city.safety}/100）`);
  push(has(city.healthcareIndex) && city.healthcareIndex >= 75, `医疗服务指数 ${city.healthcareIndex}/100，长住就医安心`);
  push(has(city.community) && city.community >= 4, `数字游民社区成熟（${city.community}/5）`);
  push(has(city.english) && city.english >= 4, '英语环境友好，日常沟通门槛低');
  push(has(city.livingScore) && city.livingScore <= 38, `综合生活成本低（综合生活指数 ${city.livingScore} · NYC=100 基准）`);
  push(
    city.climate === 'mediterranean' && has(city.tempC) && city.tempC <= 23,
    `地中海气候温润宜人（年均 ${city.tempC}°C）`,
  );
  push(
    city.climate === 'tropical' || city.climate === 'subtropical',
    `气候全年温暖${has(city.tempC) ? `（年均 ${city.tempC}°C）` : ''}`,
  );
  push(city.climate === 'desert', `日照充足、气候干燥温暖${has(city.tempC) ? `（年均 ${city.tempC}°C）` : ''}`);
  push(has(city.internetMbps) && city.internetMbps >= 90, `网络条件良好（${city.internetMbps} Mbps）`);
  push(has(city.safety) && city.safety >= 65 && city.safety < 75, `治安中上（安全指数 ${city.safety}/100）`);
  push(has(city.community) && city.community >= 3 && city.community < 4, `游民社区初具规模（${city.community}/5）`);
  push(
    has(city.tempC) && city.tempC >= 12 && city.tempC <= 26,
    `气温温和（年均 ${city.tempC}°C），全年户外活动窗口长`,
  );
  const sun = city.climateDetail?.sunshineHours;
  push(sun != null && sun >= 2500, `年日照约 ${sun} 小时，白昼充裕`);
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

  push(city.digitalNomadVisa === false, '暂无数字游民签证，需走常规居留 / 工作许可路径');
  push(has(city.english) && city.english <= 2, '非英语环境，日常事务需基础当地语言');
  push(
    has(city.internetMbps) && city.internetMbps < 80,
    `宽带中位 ${city.internetMbps} Mbps 偏低，重网络工作建议备移动热点方案`,
  );
  push(has(city.safety) && city.safety < 62, `治安指数 ${city.safety}/100 偏低，夜间出行需留意区域选择`);
  push(
    has(city.livingScore) && city.livingScore >= 50,
    `综合生活指数 ${city.livingScore}（NYC=100 基准）处于中上水平，预算建议预留 10-15% 缓冲`,
  );
  push(has(city.tempC) && city.tempC >= 23.5, `年均 ${city.tempC}°C 偏热，夏季办公环境需留意降温`);
  push(
    has(city.monthlyCostUSD) && city.monthlyCostUSD >= 1800,
    `月均综合成本约 ${money(city.monthlyCostUSD)}，一居室租金占大头`,
  );
  push(has(city.community) && city.community <= 2, `游民社区规模有限（${city.community}/5），社交需主动拓展`);
  push(has(city.pace) && city.pace >= 4, '生活节奏偏快，需要主动安排休整');
  const precip = city.climateDetail?.annualPrecipMm;
  push(precip != null && precip >= 1600, `年降水约 ${precip} mm，雨季出行需备伞`);

  // 兜底：仍不足 2 条时，用真实字段的通用提示补齐
  if (cons.length < 2 && city.climate) {
    push(true, `气候类型为${CLIMATE_LABEL[city.climate] ?? city.climate}${has(city.tempC) ? `（年均 ${city.tempC}°C）` : ''}，与日常习惯的契合度建议实地确认`);
  }
  if (cons.length < 2 && city.visaStatus == null) {
    push(true, '签证 / 居留政策待核实，出发前请以官方最新信息为准');
  }
  if (cons.length < 2) {
    push(true, '签证 / 居留政策随政策周期变动，出发前请以官方最新信息为准');
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
    return { level: 'good', label: '可以考虑长期定居', hint: '规则：匹配分 ≥ 60' };
  }
  if (match >= 50) {
    return { level: 'mid', label: '建议试住 30 天', hint: '规则：匹配分 50-59' };
  }
  return { level: 'low', label: '短期体验为主', hint: '规则：匹配分 < 50' };
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
    env: {
      pos: '偏外向高社交密度的街区——联合办公、社群活动与聚会触手可及',
      neg: '有安静角落与独立空间的城市肌理，社交可以按需开启',
    },
  },
  SN: {
    posLetter: 'N',
    negLetter: 'S',
    env: {
      pos: '文化场景与新事物供给充足，适合探索型、灵感驱动的生活方式',
      neg: '基础设施成熟、日常秩序稳定，生活可预期、消耗低',
    },
  },
  TF: {
    posLetter: 'F',
    negLetter: 'T',
    env: {
      pos: '社群氛围有温度，邻里与在地文化参与感强',
      neg: '信息透明、规则清晰的环境，减少不必要的社交消耗',
    },
  },
  JP: {
    posLetter: 'P',
    negLetter: 'J',
    env: {
      pos: '灵活性高，随到随有的生活方式空间大',
      neg: '节奏可预期、服务可靠，便于建立稳定的日常日程',
    },
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
    return AXIS_TRAIT[axis].env[positive ? 'pos' : 'neg'];
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
    factors.push(`气质同频：城市偏「${letter}」倾向，与你 ${axisScores[first]}% 的偏好方向一致`);
  }
  const topDims = Object.entries(fitDetails)
    .filter(([, v]) => v != null)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 2);
  for (const [dimKey, score] of topDims) {
    const dim = PREFERENCE_DIMENSIONS.find((d) => d.key === dimKey);
    if (dim) factors.push(`${dim.label}契合度最高（${score} 分，口径：${dim.desc}）`);
  }
  if (factors.length === 0) {
    factors.push('人格与偏好的综合契合均衡，无单项显著短板');
  }

  // 潜在挑战：规则命中即提示，最多 2 条；无张力时如实说明
  const challenges: string[] = [];
  if (axisScores.EI <= 45) {
    challenges.push('内向倾向明显：社交资源需要主动搭建，建议从固定 co-working 或兴趣社群切入');
  }
  if (axisScores.JP <= 45 && (city.pace ?? 3) >= 4) {
    challenges.push('城市节奏偏快，与你偏好规划的 J 倾向有张力——提前锁定长租与固定办公位');
  }
  if (axisScores.EI >= 55 && (city.community ?? 3) <= 2) {
    challenges.push('城市游民社群较小，外向型的社交密度需求需要更主动经营');
  }
  if (axisScores.SN <= 45 && (city.size ?? 3) <= 2) {
    challenges.push('小城服务半径有限，安家与办事需预留往返周边城市的时间');
  }
  if (axisScores.SN >= 55 && city.tags.filter((t) => ['arts', 'history', 'festivals'].includes(t)).length === 0) {
    challenges.push('本地文化场景标签较少，探索型需求可能需要向周边城市延伸');
  }
  if (axisScores.TF >= 55 && (city.safety ?? 65) < 62) {
    challenges.push('治安指数偏低，安全感的建立需重点考察居住街区的夜间环境');
  }
  if (challenges.length === 0) {
    challenges.push('从四轴向量看整体气质匹配良好，未发现明显张力项');
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
  const days = match >= 60 ? '14-21 天' : match >= 50 ? '21-30 天' : '30 天起';
  const daysMid = match >= 60 ? 17.5 : match >= 50 ? 25 : 30;
  const has = (v: number | null | undefined): v is number => v != null;
  const budget = has(city.monthlyCostUSD) ? Math.round((city.monthlyCostUSD / 30) * daysMid) : null;

  const intro = `${city.nameZh}建议先试住 ${days}：用一份短期租约验证报告结论，再决定是否长期停靠。`;

  const climateItem = city.climateDetail
    ? `${city.climateDetail.summary}（年均 ${city.climateDetail.avgTempC}°C · 年降水 ${city.climateDetail.annualPrecipMm} mm · 年日照约 ${city.climateDetail.sunshineHours} 小时）——试住期至少覆盖几个降雨日与一个温度极值日`
    : city.climate
      ? `${CLIMATE_LABEL[city.climate] ?? city.climate}，年均 ${city.tempC}°C——试住期至少覆盖几个降雨日与一个温度极值日`
      : '气候数据待补充——试住期记录逐日体感与降水';
  const budgetItem = budget
    ? `按月均综合成本 ~$${city.monthlyCostUSD!.toLocaleString('en-US')} 折算，试住期预算约 $${budget.toLocaleString('en-US')}`
    : '月均综合成本数据暂缺——试住期逐日记账建立本地成本基线';
  const livingScoreItem = has(city.livingScore)
    ? `对照综合生活指数 ${city.livingScore}（NYC=100 基准）记录房租 / 餐饮 / 通勤三项与日常账单的偏差`
    : '记录房租 / 餐饮 / 通勤三项实际支出，作为本地成本基线';
  const rentItem = has(city.housingLevel)
    ? `市中心一居室月租约 $${city.housingLevel!.toLocaleString('en-US')}——实地看 2-3 处备选房源`
    : '实地看 2-3 处备选房源，确认实际租金水位';

  const checklist: TrialChecklistGroup[] = [
    {
      title: '气候体感',
      items: [
        climateItem,
        '在不同时段步行通勤 20 分钟，记录体感、日照与湿度',
      ],
    },
    {
      title: '生活成本实测',
      items: [
        budgetItem,
        livingScoreItem,
        rentItem,
      ],
    },
    {
      title: '社交与远程工作条件',
      items: [
        has(city.internetMbps)
          ? `固定宽带中位 ${city.internetMbps} Mbps——实测晚间高峰期的视频会议稳定性`
          : '实测晚间高峰期的视频会议稳定性与移动热点可用性',
        city.digitalNomadVisa === true && city.visaLabel
          ? `签证口径：${city.visaLabel}`
          : city.visaLabel
            ? `暂无数字游民签证——试住期请确认免签或旅游签的停留天数上限（${city.visaLabel}）`
            : '签证 / 居留政策待核实——出发前确认免签或旅游签停留天数上限',
        '参加 1 次本地数字游民或行业聚会，评估社群与协作氛围',
      ],
    },
  ];

  return { days, daysMid, intro, checklist };
}
