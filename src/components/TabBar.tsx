import { useI18n } from '../i18n';
import { CHART_COLORS } from '../lib/colors';
import LangSwitch from './LangSwitch';

export type TabId = 'landing' | 'cities' | 'tax' | 'compare' | 'profile';

const TAB_KEYS: { id: TabId; key: string }[] = [
  { id: 'landing', key: 'nav.home' },
  { id: 'cities', key: 'nav.cities' },
  { id: 'tax', key: 'tax.nav' },
  { id: 'compare', key: 'nav.compare' },
  { id: 'profile', key: 'nav.profile' },
];

/** 纯几何符号图标（无 emoji） */
function TabIcon({ id, active }: { id: TabId; active: boolean }) {
  const c = active ? CHART_COLORS.coral : CHART_COLORS.inkSoft;
  if (id === 'landing') {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7.2" stroke={c} strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.1" fill={c} />
      </svg>
    );
  }
  if (id === 'cities') {
    // 城市库：四宫格图集意象
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="10.5" width="3.4" height="6.5" fill={c} />
        <rect x="8.3" y="6.5" width="3.4" height="10.5" fill={c} />
        <rect x="13.6" y="3" width="3.4" height="14" fill={c} />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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
 * 顶部导航：五 Tab + 语言切换（品牌名由首页 Hero 承载）。
 * 移动端为容纳五项并避免与语言切换重叠：小屏仅显示图标（aria-label/ title 保留可读名），
 * ≥ sm 显示图标 + 文字；nav 可横向滚动作为窄屏兜底，语言切换固定右侧不被遮挡。
 */
export default function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-almanac items-center gap-1 px-3 sm:gap-2 sm:px-4 md:px-10">
        <nav
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto sm:justify-center sm:gap-1 md:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t('nav.ariaLabel')}
        >
          {TAB_KEYS.map((tb) => {
            const isActive = tb.id === active;
            const label = t(tb.key);
            return (
              <button
                key={tb.id}
                type="button"
                onClick={() => onChange(tb.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                title={label}
                className={`flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-2.5 py-2 font-heading text-[13px] font-medium tracking-wide transition-colors duration-200 sm:px-3 md:gap-2 md:px-4 ${
                  isActive
                    ? 'bg-clay/10 text-clay'
                    : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <TabIcon id={tb.id} active={isActive} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="relative z-10 shrink-0">
          <LangSwitch />
        </div>
      </div>
    </header>
  );
}
