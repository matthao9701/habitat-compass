// PWA 安装与离线支持（客户端专用，所有能力均做特性检测与降级）
//
// 设计取舍：
//   1. 仅在本站是「可安装」时才注册 Service Worker —— iOS Safari 至今不支持
//      beforeinstallprompt，若为它强行注册 SW，反而会把整个 Safari 站点的请求
//      卷入 SW 缓存，收益为零、风险不为零。因此 iOS 走纯静态 manifest 路线。
//   2. Android / Chrome / Edge：捕获 beforeinstallprompt，延迟到首屏稳定后再弹
//      自定义安装提示（系统自带的迷你信息条样式不可控）。
//   3. 用户关闭过提示 → 记入 localStorage，冷却期内不再打扰（仍需为 dismissible）。
//   4. appinstalled 后永久静默。

import { useEffect, useState } from 'react';

/** 安装提示冷却期：用户手动关闭后，多久内不再展示（毫秒） */
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
/** 首屏稳定后延迟展示，避免与首个动画/数据加载抢注意力 */
const SHOW_DELAY_MS = 4000;

const LS_DISMISSED_AT = 'nomadmatch.v1:pwaInstallDismissedAt';
const LS_INSTALLED = 'nomadmatch.v1:pwaInstalled';

/** 原生安装事件（Chrome 系专有，TS 标准库未收录） */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

function readNumber(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function writeFlag(key: string, value: number | boolean): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // 隐私模式：静默降级为每次访问都可能提示
  }
}

/** 已作为独立应用运行（安装后从桌面图标启动） */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS Safari 非标准字段
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** iOS / iPadOS 检测（iOS 上安装只能靠「添加到主屏幕」，需要人工引导） */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
}

/** 注册 Service Worker：仅当浏览器支持原生安装事件时才注册（见文件头说明） */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (!('onbeforeinstallprompt' in window)) return;
  if (!window.isSecureContext) return;
  const register = (): void => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // 注册失败不影响主站功能：PWA 能力静默缺席
    });
  };
  // 挂载晚于 load 事件时立即注册，否则等 load，避免与首屏资源争带宽
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

interface PwaInstallState {
  /** 是否应展示自定义安装提示 */
  visible: boolean;
  /** iOS：无原生事件，需展示「添加到主屏幕」图文引导 */
  isIosGuide: boolean;
  /** 触发原生安装对话框；返回用户是否接受 */
  promptInstall: () => Promise<boolean>;
  /** 关闭提示（进入冷却期） */
  dismiss: () => void;
}

export function usePwaInstall(): PwaInstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // 已是独立应用，不再提示
    if (readNumber(LS_INSTALLED) === 1) return;

    // 冷却期在「事件触发时」才读取：beforeinstallprompt 可能在用户本次会话里
    // 手动关闭提示之后才到达，用挂载时的快照会导致刚关掉又弹一次。
    const inCooldown = (): boolean => {
      const dismissedAt = readNumber(LS_DISMISSED_AT);
      return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
    };
    let timer: number | undefined;

    const canPrompt = 'onbeforeinstallprompt' in window;
    const ios = isIos() && !canPrompt;

    const onBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      if (inCooldown()) return;
      setDeferred(event as BeforeInstallPromptEvent);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };
    const onInstalled = (): void => {
      writeFlag(LS_INSTALLED, 1);
      setDeferred(null);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // iOS：无 beforeinstallprompt，直接在冷却期后展示人工引导
    if (ios && !inCooldown()) {
      timer = window.setTimeout(() => {
        setIosGuide(true);
        setVisible(true);
      }, SHOW_DELAY_MS);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function promptInstall(): Promise<boolean> {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (choice.outcome === 'accepted') {
      writeFlag(LS_INSTALLED, 1);
      return true;
    }
    writeFlag(LS_DISMISSED_AT, Date.now());
    return false;
  }

  function dismiss(): void {
    writeFlag(LS_DISMISSED_AT, Date.now());
    setVisible(false);
  }

  return { visible, isIosGuide: iosGuide, promptInstall, dismiss };
}
