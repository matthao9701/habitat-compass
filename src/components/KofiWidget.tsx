// ABOUTME: 右下角原生打赏悬浮按钮——替代 Ko-fi 官方 iframe 浮窗（跨域无法改样式、体积大、移动端遮挡）
import { useI18n } from '../i18n';
import { markSupportEngaged } from '../lib/support';

/**
 * KofiWidget — 原生右下角打赏悬浮按钮
 *
 * 为什么不用官方 Overlay Widget（iframe 浮窗）：
 * - 官方脚本运行时向 body 注入跨域 iframe，内部样式不可控，无法真正调小或换肤；
 * - iframe 按钮体积偏大（180×65），移动端容易遮挡页脚文字与底部内容；
 * - 需额外请求 storage.ko-fi.com 脚本 + 其内部资源；在 ko-fi.com 不可达网络下按钮直接消失。
 *
 * 现方案（原生组件，零第三方脚本）：
 * - 与页脚打赏入口同款「咖啡」视觉：圆形按钮，取项目主色 pine，hover 转 clay；
 * - 体积收敛为 44×44（移动端触控最小可点面积），右下角固定；桌面端 hover 弹出文字提示；
 * - 层级 z-45：低于 PWA 安装卡（z-50）、高于正文，且不与顶部导航（z-40）重叠；
 * - 底部留出 safe-area-inset-bottom，避开 iPhone 手势条；
 * - 点击在新标签打开 Ko-fi 主页完成打赏，不拖慢首屏、不做全屏弹层。
 *
 * 仅挂于 SPA 侧；静态落地页（dist/**）仍保持「零外链脚本 + 单请求自包含」。
 */

// ── 配置区（改这里即可）───────────────────────────────────────────────
/** Ko-fi 用户名（ko-fi.com/<ID> 中的 <ID>） */
const KOFI_ID = 'matthao9701';
/** 打赏主页（新标签打开） */
const KOFI_URL = `https://ko-fi.com/${KOFI_ID}`;
// ─────────────────────────────────────────────────────────────────────

/** 咖啡图标（描边风格，随 currentColor） */
function CoffeeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M3.5 5.5h10v5.2a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V5.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M13.5 6.6h1.6a2 2 0 0 1 0 4h-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5.8 2.6c-.4.5-.4 1 0 1.5M8.5 2.4c-.4.5-.4 1 0 1.5M11.2 2.6c-.4.5-.4 1 0 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function KofiWidget() {
  const { t } = useI18n();
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('footer.supportAria')}
      onClick={markSupportEngaged}
      className="group fixed right-4 z-[45] inline-flex items-center
        [bottom:calc(56px_+_0.75rem_+_env(safe-area-inset-bottom))] md:[bottom:calc(1rem_+_env(safe-area-inset-bottom))]"
    >
      {/* 桌面端 hover 提示（移动端无 hover，隐藏；文案由 aria-label 承载无障碍） */}
      <span
        role="presentation"
        className="pointer-events-none absolute right-full top-1/2 mr-2.5 hidden -translate-y-1/2 whitespace-nowrap
          rounded-lg bg-ink px-2.5 py-1 text-[11px] font-medium text-paper opacity-0 shadow-lg
          transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 md:block"
      >
        {t('footer.support')}
      </span>
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pine text-paper shadow-[0_6px_20px_-6px_rgba(29,53,87,0.55)]
          transition-all duration-300 ease-chart group-hover:-translate-y-0.5 group-hover:bg-clay
          group-hover:shadow-[0_10px_26px_-8px_rgba(201,106,82,0.6)] group-focus-visible:ring-2 group-focus-visible:ring-clay/50"
      >
        <CoffeeIcon />
      </span>
    </a>
  );
}
