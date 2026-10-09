// ABOUTME: 赞助意向标记——记录用户是否点过打赏入口，用于页脚赞助引导的温和收束（纯本地，无网络）
//
// 页脚不再放大胶囊按钮，仅保留一行赞助引导；当用户已经点过右下角悬浮咖啡（或页脚的同款
// 链接）后，说明入口已被知晓，页脚可收起该行，避免重复打扰。跨组件通过自定义事件即时同步。

const KEY = 'nomadmatch.v1:supportEngaged';
/** 标记变化时派发，供同页多组件（悬浮件 / 页脚）实时同步 */
export const SUPPORT_EVENT = 'hc:support-engaged';

export function hasEngagedSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markSupportEngaged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    // 隐私模式：静默降级，仅本次不收起
  }
  window.dispatchEvent(new Event(SUPPORT_EVENT));
}
