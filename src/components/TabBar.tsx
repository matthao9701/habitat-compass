import { useI18n } from '../i18n';
import { CHART_COLORS } from '../lib/colors';
import LangSwitch from './LangSwitch';
import CompassMark from './CompassMark';

export type TabId = 'landing' | 'cities' | 'tax' | 'compare' | 'profile';

/** 四个核心入口（「首页」由品牌标识承载，不再单列，避免底部栏拥挤） */
const TAB_ITEMS: { id: TabId; key: string }[] = [
  { id: 'cities', key: 'nav.explore' },
  { id: 'tax', key: 'tax.nav' },
  { id: 'compare', key: 'nav.compare' },
  { id: 'profile', key: 'nav.profile' },
];

/** 当前页标题（移动端顶栏展示；landing 为空，避免与左侧品牌名重复） */
const PAGE_TITLE_KEY: Partial<Record<TabId, string>> = {
  cities: 'nav.explore',
  tax: 'tax.nav',
  compare: 'nav.compare',
  profile: 'nav.profile',
};

/** 纯几何符号图标（无 emoji），尺寸可调以适配顶栏 / 底部栏 */
export function TabIcon({ id, active, size = 18 }: { id: TabId; active: boolean; size?: number }) {
  const c = active ? CHART_COLORS.coral : CHART_COLORS.inkSoft;
  if (id === 'landing') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7.2" stroke={c} strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.1" fill={c} />
      </svg>
    );
  }
  if (id === 'cities') {
    // 探索 / 城市库：四宫格图集意象
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="6" height="6" rx="1.1" stroke={c} strokeWidth="1.4" />
        <rect x="11" y="3" width="6" height="6" rx="1.1" stroke={c} strokeWidth="1.4" />
        <rect x="3" y="11" width="6" height="6" rx="1.1" stroke={c} strokeWidth="1.4" />
        <rect x="11" y="11" width="6" height="6" rx="1.1" fill={c} />
      </svg>
    );
  }
  if (id === 'tax') {
    // 税负测算：计算器意象——方框内点阵，区别于对比柱状图
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3.2" y="3.2" width="13.6" height="13.6" rx="2.4" stroke={c} strokeWidth="1.5" />
        <path d="M6.6 8h6.8" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="7.2" cy="12.4" r="1.05" fill={c} />
        <circle cx="10" cy="12.4" r="1.05" fill={c} />
        <circle cx="12.8" cy="12.4" r="1.05" fill={c} />
      </svg>
    );
  }
  if (id === 'compare') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="10.5" width="3.4" height="6.5" fill={c} />
        <rect x="8.3" y="6.5" width="3.4" height="10.5" fill={c} />
        <rect x="13.6" y="3" width="3.4" height="14" fill={c} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.8" r="3.3" stroke={c} strokeWidth="1.5" />
      <path
        d="M3.6 17c1.4-2.9 3.7-4.4 6.4-4.4s5 1.5 6.4 4.4"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 全站导航枢纽（响应式双形态）：
 *
 * - 移动端（< md）：顶栏精简为「Logo/站点名 + 当前页标题 + 中英切换」；
 *   核心入口下沉为底部固定栏（原生 App 布局），四项均分、图标 + 文字、
 *   加大点击热区，并处理底部安全区；由 App 侧预留防遮挡间距。
 * - 桌面端（≥ md）：自动隐藏底部栏，顶栏横向展开，每项「图标 + 文字」，
 *   当前项以温和胶囊底色高亮。
 *
 * 品牌标识（Logo）点击即回首页——「首页」不再占用导航条目。
 */
export default function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  const { t } = useI18n();
  const siteName = t('landing.hero.title');
  const pageTitleKey = PAGE_TITLE_KEY[active];
  const pageTitle = pageTitleKey ? t(pageTitleKey) : '';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-almanac items-center gap-3 px-4 md:h-16 md:gap-2 md:px-6 lg:px-10">
          {/* 品牌标识：点击回首页 */}
          <button
            type="button"
            onClick={() => onChange('landing')}
            className="flex shrink-0 items-center gap-2 text-ink transition-opacity hover:opacity-80 lg:mr-1"
            aria-label={siteName}
          >
            <CompassMark size={24} />
            <span className="block leading-tight md:hidden lg:block">
              <span className="block font-display text-[14px] font-semibold tracking-wide">{siteName}</span>
              <span className="block font-mono text-[8px] uppercase tracking-eyebrow text-ink-soft">
                overseas almanac
              </span>
            </span>
          </button>

          {/* 当前页标题（移动端，占位保持右侧语言切换贴边；landing 时留空避免与品牌名重复） */}
          <span className="min-w-0 flex-1 truncate font-heading text-[13.5px] font-medium tracking-wide text-ink-soft md:hidden">
            {pageTitle}
          </span>

          {/* 横向导航（桌面端） */}
          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex md:gap-2"
            aria-label={t('nav.ariaLabel')}
          >
            {TAB_ITEMS.map((tb) => {
              const isActive = tb.id === active;
              const label = t(tb.key);
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => onChange(tb.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 font-heading text-[13.5px] font-medium tracking-wide transition-colors duration-200 ${
                    isActive
                      ? 'bg-clay/10 text-clay'
                      : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  <TabIcon id={tb.id} active={isActive} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="relative z-10 shrink-0">
            <LangSwitch />
          </div>
        </div>
      </header>

      {/* 底部导航栏（仅移动端）：原生 App 式四入口 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label={t('nav.ariaLabel')}
      >
        <div className="mx-auto flex max-w-almanac items-stretch">
          {TAB_ITEMS.map((tb) => {
            const isActive = tb.id === active;
            const label = t(tb.key);
            return (
              <button
                key={tb.id}
                type="button"
                onClick={() => onChange(tb.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5 transition-colors duration-150 ${
                  isActive ? 'text-clay' : 'text-ink-soft active:bg-ink/5'
                }`}
              >
                <TabIcon id={tb.id} active={isActive} size={20} />
                <span className="font-heading text-[10.5px] font-medium leading-none tracking-wide">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
