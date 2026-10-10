// ABOUTME: 报告「四层深度诊断」规则分析层（第十一轮）
// ABOUTME: 纯函数规则模板：输入人格四轴、生活偏好与城市库真实字段，输出
// ABOUTME: 游牧原型画像 / 雷区警示 / 加权推荐梯队 / 现实落地账本，不调用外部 LLM。
// ABOUTME: 返回值为 i18n 键（而非已翻译文本），由渲染层 t() 按当前语言输出。

import type { AxisName, CityMatch } from './engine';
import type { City } from '../data/types';
import { overlapHours } from './timezone';

// ---------------------------------------------------------------------------
// 第二层 · 雷区警示（Track：把主观人格特征映射到客观现实摩擦力）
// ---------------------------------------------------------------------------

/** 四轴主导字母 → 正向/负向环境文案键（与 analysis.ts 的 an.env.* 同源） */
const AXIS_ENV: Record<AxisName, { pos: string; neg: string }> = {
  EI: { pos: 'an.env.EI.pos', neg: 'an.env.EI.neg' },
  SN: { pos: 'an.env.SN.pos', neg: 'an.env.SN.neg' },
  TF: { pos: 'an.env.TF.pos', neg: 'an.env.TF.neg' },
  JP: { pos: 'an.env.JP.pos', neg: 'an.env.JP.neg' },
};

/** 最强 1–2 轴对应的「赋能环境」文案键 */
export function enablingEnvironments(axisScores: Record<AxisName, number>): string[] {
  const axes: AxisName[] = ['EI', 'SN', 'TF', 'JP'];
  const sorted = [...axes].sort((a, b) => Math.abs(axisScores[b] - 50) - Math.abs(axisScores[a] - 50));
  return sorted.slice(0, 2).map((axis) => AXIS_ENV[axis][axisScores[axis] >= 50 ? 'pos' : 'neg']);
}

/** 由首选城市真实数据补充的「赋能环境」文案键（网络 / 都会密度 / 自然可达） */
export function cityEnablers(city: City): string[] {
  const out: string[] = [];
  if (city.internetMbps != null && city.internetMbps >= 120) out.push('rep.enable.network');
  if (city.size != null && city.size >= 4) out.push('rep.enable.urban');
  const tagSet = new Set(city.tags);
  const natureHits = ['nature', 'outdoor', 'beach', 'watersports'].filter((t) => tagSet.has(t)).length;
  if (natureHits >= 1 || (city.climateDetail?.sunshineHours ?? 0) >= 2500) out.push('rep.enable.nature');
  return out;
}

/** 组合「最佳赋能环境」：2 条人格环境 + 最多 1 条城市环境 */
export function bestEnvironments(axisScores: Record<AxisName, number>, city: City): string[] {
  return [...enablingEnvironments(axisScores), ...cityEnablers(city)].slice(0, 3);
}

/**
 * 「致命摩擦力」：按优先级取 2 条，全部由现实环境规则派生，不编造。
 * 优先级：气候偏好 → 预算 → EI（最界定游牧形态）→ TF → JP → SN。
 * 气候/预算优先，确保「客观现实摩擦力」先于性格倾向被点出。
 */
export function dealbreakers(
  axisScores: Record<AxisName, number>,
  preferences: Record<string, string>,
): string[] {
  const out: string[] = [];
  const push = (k: string): void => {
    if (out.length < 2 && !out.includes(k)) out.push(k);
  };

  // 气候偏好：爱热带者怕阴冷寒冬；爱冷带者怕湿热
  if (preferences.climate === 'tropical') push('rep.deal.noSun');
  else if (preferences.climate === 'cool') push('rep.deal.hotHumid');
  // 低预算者怕高消费枢纽
  if (preferences.budget === 'lt1000' || preferences.budget === '1000-1500') push('rep.deal.costHigh');
  // EI：偏 I（低外向）最怕狂欢社群；偏 E（高外向）最怕孤寂小城
  push(axisScores.EI < 50 ? 'rep.deal.party' : 'rep.deal.isolation');
  // TF：偏 F 怕冷漠功利；偏 T 怕人情纠缠
  push(axisScores.TF >= 50 ? 'rep.deal.coldHeart' : 'rep.deal.drama');
  // JP：偏 P 怕刻板流程；偏 J 怕高度不确定
  push(axisScores.JP >= 50 ? 'rep.deal.rigid' : 'rep.deal.uncertainty');
  // SN：偏 N 怕无趣之地；偏 S 怕混乱环境
  push(axisScores.SN >= 50 ? 'rep.deal.boring' : 'rep.deal.chaos');

  return out.slice(0, 2);
}

// ---------------------------------------------------------------------------
// 第三层 · 加权推荐梯队（基准 / 高性价比 / 探索惊喜）
// ---------------------------------------------------------------------------

export interface RecommendationTiers {
  baseline: CityMatch;
  /** 高性价比备选：开销显著更低且核心契合不塌方；无合适者回退为次高分城市 */
  value: CityMatch | null;
  /** 探索性惊喜：冷门偏好（兴趣契合）突出、排名在头部梯队之外的城市 */
  surprise: CityMatch | null;
  /** 备选相较基准每月省下的美元（无则 null） */
  valueSavedUSD: number | null;
}

/**
 * 从完整排序城市列表中挑三档：
 * - baseline = 排名第 1
 * - value = 排名 ≥ 2、月成本比基准低 ≥ 15% 且 match ≥ 基准 − 12 中，成本最低者；
 *   若无，则取（排名 ≥ 2）中月成本最低者作为备选。
 * - surprise = 排名 ≥ 6 的城市中 interestFit 最高者（冷门兴趣导向），无则取排名第 6。
 */
export function recommendTiers(allMatches: CityMatch[]): RecommendationTiers | null {
  if (allMatches.length === 0) return null;
  const baseline = allMatches[0];
  const rest = allMatches.slice(1);

  const baseCost = baseline.city.monthlyCostUSD;
  const costOf = (m: CityMatch): number => m.city.monthlyCostUSD ?? Number.POSITIVE_INFINITY;

  let value: CityMatch | null = null;
  if (rest.length > 0) {
    const cheaper = rest.filter(
      (m) =>
        baseCost != null &&
        m.city.monthlyCostUSD != null &&
        m.city.monthlyCostUSD <= baseCost * 0.85 &&
        m.match >= baseline.match - 12,
    );
    const pool = cheaper.length > 0 ? cheaper : rest;
    value = pool.reduce((best, m) => (costOf(m) < costOf(best) ? m : best), pool[0]);
  }

  const tail = allMatches.length >= 6 ? allMatches.slice(5) : allMatches.slice(1);
  let surprise: CityMatch | null = null;
  if (tail.length > 0) {
    surprise = tail.reduce((best, m) => ((m.interestFit ?? -1) > (best.interestFit ?? -1) ? m : best), tail[0]);
  }

  const valueSavedUSD =
    value != null && baseCost != null && value.city.monthlyCostUSD != null
      ? Math.max(0, baseCost - value.city.monthlyCostUSD)
      : null;

  return { baseline, value, surprise, valueSavedUSD };
}

// ---------------------------------------------------------------------------
// 第四层 · 现实落地账本（成本 / 黄金重叠时间 / 签证）
// ---------------------------------------------------------------------------

export interface LedgerCost {
  shareRoom: number | null;
  solo: number | null;
  avg: number | null;
}

export interface RealityLedger {
  cost: LedgerCost;
  /** 与核心协作方（北京 / 伦敦）的每工作日实时重叠小时数 */
  overlapBeijing: number | null;
  overlapLondon: number | null;
  /** 数字游民签证：true 有 / false 无 / null 待核实 */
  digitalNomadVisa: boolean | null;
  visaLabel: string | null;
}

export function realityLedger(city: City): RealityLedger {
  const housing = city.housingLevel;
  return {
    cost: {
      shareRoom: housing != null ? Math.round(housing * 0.45) : null,
      solo: housing ?? null,
      avg: city.monthlyCostUSD ?? null,
    },
    overlapBeijing: overlapHours(city.timezone, 'beijing'),
    overlapLondon: overlapHours(city.timezone, 'london'),
    digitalNomadVisa: city.digitalNomadVisa ?? null,
    visaLabel: city.visaLabel ?? null,
  };
}
