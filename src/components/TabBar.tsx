import { useI18n } from '../i18n';
import { CHART_COLORS } from '../lib/colors';
import LangSwitch from './LangSwitch';

export type TabId = 'landing' | 'compare' | 'profile';

const TAB_KEYS: { id: TabId; key: string }[] = [
  { id: 'landing', key: 'nav.home' },
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

/** 顶部导航：三 Tab + 语言切换（品牌名由首页 Hero 承载） */
export default function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-almanac items-center justify-between px-4 md:px-10">
        <nav
          className="flex items-center gap-1.5 md:mx-auto md:gap-8"
          aria-label={t('nav.ariaLabel')}
        >
          {TAB_KEYS.map((tb) => {
            const isActive = tb.id === active;
            return (
              <button
                key={tb.id}
                type="button"
                onClick={() => onChange(tb.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-[7px] px-2.5 py-2 font-heading text-[13px] font-medium tracking-wide transition-colors duration-200 md:gap-2 md:px-4 ${
                  isActive
                    ? 'bg-clay/10 text-clay'
                    : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <TabIcon id={tb.id} active={isActive} />
                {t(tb.key)}
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
