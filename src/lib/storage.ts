// localStorage 持久化层（客户端专用，全部 try/catch 兜底）
import type { AssessmentResult, UserAnswers } from './engine';

const PREFIX = 'nomadmatch.v1:';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 存储满 / 隐私模式：静默降级
  }
}

function remove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

// ---- 测评草稿 ----

export function loadDraft(): UserAnswers | null {
  return read<UserAnswers | null>('draft', null);
}

export function saveDraft(answers: UserAnswers): void {
  write('draft', answers);
}

export function clearDraft(): void {
  remove('draft');
}

// ---- 测验历史（最近一次） ----

export interface HistoryEntry {
  answers: UserAnswers;
  result: AssessmentResult;
  savedAt: number;
}

export function loadHistory(): HistoryEntry | null {
  return read<HistoryEntry | null>('history', null);
}

export function saveHistory(answers: UserAnswers, result: AssessmentResult): void {
  const entry: HistoryEntry = { answers, result, savedAt: Date.now() };
  write('history', entry);
}

// ---- 收藏城市 ----

export function loadFavorites(): string[] {
  return read<string[]>('favorites', []);
}

export function saveFavorites(ids: string[]): void {
  write('favorites', ids);
}

// ---- 对比页工作区状态 ----

export interface CompareState {
  selected: string[];
  weights: Record<string, number>;
  cityNotes: Record<string, string>;
  overallNote: string;
}

export function loadCompareState(): CompareState | null {
  return read<CompareState | null>('compare', null);
}

export function saveCompareState(state: CompareState): void {
  write('compare', state);
}

// ---- 已保存的对比存档 ----

export interface CompareArchive {
  id: string;
  savedAt: number;
  cities: string[];
  weights: Record<string, number>;
  composites: { id: string; score: number }[];
  cityNotes: Record<string, string>;
  overallNote: string;
  personalized: boolean;
}

export function loadArchives(): CompareArchive[] {
  return read<CompareArchive[]>('archives', []);
}

export function saveArchive(snapshot: CompareArchive): void {
  const list = loadArchives();
  list.unshift(snapshot);
  write('archives', list.slice(0, 12));
}

export function removeArchive(id: string): void {
  write(
    'archives',
    loadArchives().filter((a) => a.id !== id),
  );
}

// ---- 虚拟计费（演示环境：不产生真实扣款） ----

export const PRO_PRICE_CNY = 29.9;

export type PayChannel = 'alipay' | 'wechat' | 'card';

export interface ProOrder {
  id: string;
  createdAt: number;
  amountCny: number;
  channel: PayChannel;
  /** 虚拟订单状态，演示环境固定 paid */
  status: 'paid';
}

export function isProUnlocked(): boolean {
  return read<boolean>('proUnlocked', false);
}

export function setProUnlocked(v: boolean): void {
  write('proUnlocked', v);
}

export function loadOrders(): ProOrder[] {
  return read<ProOrder[]>('orders', []);
}

function saveOrders(list: ProOrder[]): void {
  write('orders', list);
}

/** 生成虚拟订单并解锁标准版 */
export function createProOrder(channel: PayChannel): ProOrder {
  const order: ProOrder = {
    id: `VM${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`,
    createdAt: Date.now(),
    amountCny: PRO_PRICE_CNY,
    channel,
    status: 'paid',
  };
  const list = loadOrders();
  list.unshift(order);
  saveOrders(list.slice(0, 20));
  setProUnlocked(true);
  return order;
}

/** 演示用：重置购买记录（清空订单 + 解锁状态），需二次确认 */
export function resetBilling(): void {
  remove('orders');
  setProUnlocked(false);
}

// ---- 标准版草稿与历史（与简易版分开存，互不覆盖） ----

export function loadProDraft(): UserAnswers | null {
  return read<UserAnswers | null>('proDraft', null);
}

export function saveProDraft(answers: UserAnswers): void {
  write('proDraft', answers);
}

export function clearProDraft(): void {
  remove('proDraft');
}

export function loadProHistory(): HistoryEntry | null {
  return read<HistoryEntry | null>('proHistory', null);
}

export function saveProHistory(answers: UserAnswers, result: AssessmentResult): void {
  const entry: HistoryEntry = { answers, result, savedAt: Date.now() };
  write('proHistory', entry);
}

// ---- 硬性条件（第六轮：与草稿分开独立键，修改后可重算） ----

import type { HardConstraints } from './constraints';
import type { PassportCode } from '../data/types';

export function loadHardConstraints(): HardConstraints | null {
  return read<HardConstraints | null>('hardConstraints', null);
}

export function saveHardConstraints(hc: HardConstraints): void {
  write('hardConstraints', hc);
}

// ---- 护照/国籍（第九轮；硬约束步骤选择，跨会话记忆） ----

export function loadPassport(): PassportCode {
  return read<PassportCode>('passport', 'CN');
}

export function savePassport(code: PassportCode): void {
  write('passport', code);
}
