// ABOUTME: 全站页脚——品牌 + 法律链接（用户协议 / 隐私政策 / 免责声明），编辑部风视觉强化
import CompassMark from './CompassMark';
import { useI18n } from '../i18n';

/** 法律链接小图标（描边风格，随文字 currentColor） */
function LegalIcon({ kind }: { kind: 'terms' | 'privacy' | 'disclaimer' }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: '0 0 20 20',
    fill: 'none',
    'aria-hidden': true as const,
    className: 'shrink-0',
  };
  if (kind === 'terms') {
    return (
      <svg {...common}>
        <path d="M5 2.5h7l3 3V17.5H5V2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M12 2.5V6h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M7.5 9.5h5M7.5 12.5h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'privacy') {
    return (
      <svg {...common}>
        <path d="M10 2.5 4 5v5c0 3.6 2.5 6.3 6 7.5 3.5-1.2 6-3.9 6-7.5V5l-6-2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M7.6 10.2l1.7 1.7 3.1-3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 8.8v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="10" cy="6.3" r="0.9" fill="currentColor" />
    </svg>
  );
}

export default function Footer() {
  const { t, lang } = useI18n();
  const base = lang === 'en' ? '/en' : '';
  const links: { kind: 'terms' | 'privacy' | 'disclaimer'; label: string; href: string }[] = [
    { kind: 'terms', label: t('footer.terms'), href: `${base}/terms/` },
    { kind: 'privacy', label: t('footer.privacy'), href: `${base}/privacy/` },
    { kind: 'disclaimer', label: t('footer.disclaimer'), href: `${base}/disclaimer/` },
  ];
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t hairline bg-paper-deep/45">
      <div className="mx-auto max-w-5xl px-6 py-11 md:px-10">
        <div className="flex flex-col gap-9 md:flex-row md:items-start md:justify-between">
          {/* 品牌 */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="text-clay">
                <CompassMark size={30} />
              </span>
              <div className="leading-tight">
                <p className="font-display text-[16px] font-semibold tracking-tight text-ink">
                  栖居罗盘
                  <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-eyebrow text-ink-soft">
                    Habitat Compass
                  </span>
                </p>
                <p className="mt-1 text-[11.5px] text-ink-soft">{t('footer.tagline')}</p>
              </div>
            </div>
          </div>

          {/* 法律与合规 */}
          <nav aria-label={t('footer.legalHeading')} className="md:pt-0.5">
            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
              {t('footer.legalHeading')}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              {links.map((l) => (
                <a
                  key={l.kind}
                  href={l.href}
                  className="group inline-flex items-center gap-2 rounded-full border hairline bg-card px-4 py-2 text-[12.5px] font-medium text-ink
                    transition-all duration-300 ease-chart hover:-translate-y-0.5 hover:border-pine hover:bg-pine hover:text-paper
                    hover:shadow-[0_6px_18px_-8px_rgba(29,53,87,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine/40"
                >
                  <LegalIcon kind={l.kind} />
                  {l.label}
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* 底栏 */}
        <div className="mt-9 flex flex-col gap-2 border-t hairline pt-5 text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow">
            © {year} 栖居罗盘 · Habitat Compass
          </span>
          <span className="font-mono text-[10px] tracking-wide">{t('footer.note')}</span>
        </div>
      </div>
    </footer>
  );
}
