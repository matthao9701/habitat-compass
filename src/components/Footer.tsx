// ABOUTME: 全站页脚——品牌 + 信任锚点 + 法律与合规（含数据/字体许可 → 方法论），单一规整区块
import CompassMark from './CompassMark';
import { useI18n } from '../i18n';

/** 法律链接小图标（描边风格，随文字 currentColor） */
function LegalIcon({ kind }: { kind: 'terms' | 'privacy' | 'disclaimer' | 'methodology' }) {
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
  if (kind === 'methodology') {
    return (
      <svg {...common}>
        <path d="M4 16.5V5.5a2 2 0 0 1 2-2h3v13H6a2 2 0 0 0-2 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M16 16.5V5.5a2 2 0 0 0-2-2h-3v13h3a2 2 0 0 1 2 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M7.4 7.6h.9M7.4 10.2h.9M11.7 7.6h.9M11.7 10.2h.9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
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
  const links: { kind: 'terms' | 'privacy' | 'disclaimer' | 'methodology'; label: string; href: string }[] = [
    { kind: 'terms', label: t('footer.terms'), href: `${base}/terms/` },
    { kind: 'privacy', label: t('footer.privacy'), href: `${base}/privacy/` },
    { kind: 'disclaimer', label: t('footer.disclaimer'), href: `${base}/disclaimer/` },
    { kind: 'methodology', label: t('footer.methodology'), href: `${base}/methodology/` },
  ];
  const year = new Date().getFullYear();

  return (
    <footer className="border-t hairline bg-paper-deep/50">
      <div className="mx-auto max-w-5xl px-6 py-11 md:px-10">
        <div className="flex flex-col gap-9 md:flex-row md:items-start md:justify-between">
          {/* 品牌 + 信任锚点 */}
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
            {/* 数据时效胶囊 */}
            <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border hairline bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-moss" aria-hidden="true" />
              {t('trust.dataUpdated')}
            </p>
            {/* 社群纠错邮箱 */}
            <p className="mt-3 text-[12px] leading-[1.8] text-ink-soft">
              {t('trust.contactLead')}{' '}
              <a
                href="mailto:hi@habitatcompass.com"
                className="font-medium text-pine underline decoration-pine/30 underline-offset-4 transition-colors hover:decoration-pine"
              >
                hi@habitatcompass.com
              </a>
              {t('trust.contactTail')}
            </p>
          </div>

          {/* 法律与合规（协议 + 方法论，数据/字体许可归此） */}
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
            {/* 数据 / 字体许可：收敛为一句，详见方法论页 */}
            <p className="mt-3.5 max-w-md text-[11px] leading-[1.75] text-ink-soft">
              {t('footer.attribution')}{' '}
              <a
                href={`${base}/methodology/`}
                className="text-pine underline decoration-pine/30 underline-offset-4 transition-colors hover:decoration-pine"
              >
                {t('footer.methodology')}
              </a>
            </p>
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
