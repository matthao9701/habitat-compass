export type TabId = 'landing' | 'compare' | 'profile';

const TABS: { id: TabId; label: string }[] = [
  { id: 'landing', label: '首页' },
  { id: 'compare', label: '城市对比' },
  { id: 'profile', label: '我的' },
];

/** 纯几何符号图标（无 emoji） */
function TabIcon({ id, active }: { id: TabId; active: boolean }) {
  const c = active ? '#BE5A38' : '#4A5950';
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

/** 顶部导航：只保留三个 Tab（品牌名由首页 Hero 承载），居中排布、加大留白 */
export default function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-almanac items-center justify-center px-5 md:px-10">
        <nav className="flex items-center gap-2 md:gap-8" aria-label="主导航">
          {TABS.map((t) => {
            const isActive = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-[7px] px-4 py-2 font-heading text-[13px] font-medium tracking-wide transition-colors duration-200 ${
                  isActive
                    ? 'bg-clay/10 text-clay'
                    : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <TabIcon id={t.id} active={isActive} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
