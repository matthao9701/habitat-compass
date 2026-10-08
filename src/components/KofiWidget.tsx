import { useEffect } from 'react';

/**
 * KofiWidget — Ko-fi 悬浮打赏微件（Overlay Widget）
 *
 * 设计要点：
 * - 仅挂在 SPA（React 入口）侧：静态落地页（dist/**）保持「零外链脚本 + 单请求自包含」，
 *   既不动 SEO 首屏，也不破坏 verify-legal 的自包含断言。
 * - 外部脚本不阻塞首屏：在组件挂载（useEffect）后动态插入，且 async/defer 双保险、
 *   放入 body 末尾；核心业务逻辑先于它完成渲染。
 * - 重复加载防御：模块级只注入一次；即使 StrictMode 双调用 effect 或组件重挂载，
 *   SPA 内也只会存在一个悬浮胶囊。Ko-fi 自身弹层挂在 body 下，不随 React 卸载而丢失。
 * - 层级：按钮胶囊被压到 PWA 安装卡（z-50）之下，避免移动端右下角遮挡核心安装引导；
 *   打赏弹层（另一 class）不受影响，仍保持其原生 10000 层级。
 */

// ── 配置区（改这里即可）───────────────────────────────────────────────
/** Ko-fi 用户名。⚠️ 占位值：上线前请替换为真实 ID（如 ko-fi.com/<ID> 中的 <ID>） */
const KOFI_ID = 'YOUR_KOFI_ID';
/** 按钮文案。备选：'Buy me a coffee'（Ko-fi 经典款）；此处取更克制的 'Support' */
const KOFI_BUTTON_TEXT = 'Support';
/** 按钮背景色 = 项目主色调 pine（tailwind.config.js → colors.pine） */
const KOFI_BUTTON_BG = '#1D3557';
/** 按钮文字色 */
const KOFI_BUTTON_TEXT_COLOR = '#ffffff';
/** 官方 Overlay Widget 脚本 */
const KOFI_SCRIPT_SRC = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
// ─────────────────────────────────────────────────────────────────────

type KofiDrawConfig = Record<string, string>;
declare global {
  interface Window {
    kofiWidgetOverlay?: { draw: (id: string, config: KofiDrawConfig) => void };
    /** 注入哨兵：SPA 内单例守卫（跨组件重挂载/StrictMode 双调用均只注入一次） */
    __hcKofiInjected?: boolean;
  }
}

export default function KofiWidget() {
  useEffect(() => {
    // 占位未替换时不注入，避免向 ko-fi.com 发无效请求
    if (KOFI_ID === 'YOUR_KOFI_ID') return;
    // 单例守卫
    if (window.__hcKofiInjected) return;
    window.__hcKofiInjected = true;

    const draw = () => {
      window.kofiWidgetOverlay?.draw(KOFI_ID, {
        type: 'floating-chat',
        'floating-chat.donateButton.text': KOFI_BUTTON_TEXT,
        'floating-chat.donateButton.background-color': KOFI_BUTTON_BG,
        'floating-chat.donateButton.text-color': KOFI_BUTTON_TEXT_COLOR,
        // 不加载 Google Fonts（DM Sans），改为继承站点字体：少一次第三方请求、少一处隐私面
        'floating-chat.stylesheets': '[]',
      });
    };

    // 脚本已就绪（或由前一次挂载注入）→ 直接渲染
    if (window.kofiWidgetOverlay) {
      draw();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${KOFI_SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', draw, { once: true });
    if (!existing) {
      // async：动态脚本默认立即下载不阻塞解析；defer 一并声明，兼容部分旧引擎语义
      script.src = KOFI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return null;
}
