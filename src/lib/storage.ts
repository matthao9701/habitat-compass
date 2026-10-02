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
