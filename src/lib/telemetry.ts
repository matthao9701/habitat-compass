/**
 * telemetry.ts — 第六轮：轻量埋点（纯前端 localStorage 计数，无后端、无个人身份信息）
 *
 * 记录事件：版本选择 / 各阶段开始与完成 / 报告生成 / 硬约束使用 /
 * 付费页曝光 / 支付点击 / 解锁成功。
 * 存储：nomadmatch.v1:funnel → Record<eventKey, { count, last }>
 * 命名约定：eventKey = 事件名（可带阶段后缀），如 'stage_start_1_personality'。
 */
const FUNNEL_KEY = 'nomadmatch.v1:funnel';

export type FunnelEvent =
  | 'quiz_version_lite'
  | 'quiz_version_pro'
  | 'report_generated'
  | 'hard_constraints_used'
  | 'pro_intro_view'
  | 'pay_click'
  | 'unlock_success';

interface FunnelEntry {
  count: number;
  last: number;
}

export type FunnelData = Record<string, FunnelEntry>;

function readFunnel(): FunnelData {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FUNNEL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FunnelData;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeFunnel(data: FunnelData): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(FUNNEL_KEY, JSON.stringify(data));
  } catch {
    /* 存储不可用时静默降级 */
  }
}

/** 记录一次事件（count +1 并更新 last 时间戳） */
export function track(event: string): void {
  const data = readFunnel();
  const prev = data[event] ?? { count: 0, last: 0 };
  data[event] = { count: prev.count + 1, last: Date.now() };
  writeFunnel(data);
}

/** 读取全部漏斗计数（按首末时间排序给 UI） */
export function getFunnel(): FunnelData {
  return readFunnel();
}

/** 阶段事件辅助：stage_start / stage_complete + 序号与阶段名 */
export function trackStage(kind: 'start' | 'complete', stageIndex: number, stageName: string): void {
  track(`${kind === 'start' ? 'stage_start' : 'stage_complete'}_${stageIndex}_${stageName}`);
}
