// ABOUTME: 全站页脚——品牌 + 信任锚点 + 轻量法律合规文字链 + 赞助引导 + 版权底栏（暖米色、高信噪比）
import { useEffect, useState } from 'react';
import CompassMark from './CompassMark';
import { useI18n } from '../i18n';
import { hasEngagedSupport, markSupportEngaged, SUPPORT_EVENT } from '../lib/support';

/** 咖啡图标（赞助入口，描边风格随 currentColor） */
function CoffeeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M3.5 5.5h10v5.2a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V5.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M13.5 6.6h1.6a2 2 0 0 1 0 4h-1.6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.8 2.6c-.4.5-.4 1 0 1.5M8.5 2.4c-.4.5-.4 1 0 1.5M11.2 2.6c-.4.5-.4 1 0 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export default function Footer() {
  const { t, lang } = useI18n();
  const base = lang === 'en' ? '/en' : '';
  const links: { label: string; href: string }[] = [
    { label: t('footer.terms'), href: `${base}/terms/` },
    { label: t('footer.privacy'), href: `${base}/privacy/` },
    { label: t('footer.disclaimer'), href: `${base}/disclaimer/` },
    { label: t('footer.dataSources'), href: `${base}/methodology/` },
  ];
  const year = new Date().getFullYear();
  // 用户已点过打赏入口（悬浮咖啡或页脚链接）→ 收起页脚赞助引导，避免入口重复
  const [supportEngaged, setSupportEngaged] = useState(hasEngagedSupport);
  useEffect(() => {
    const sync = (): void => setSupportEngaged(hasEngagedSupport());
    window.addEventListener(SUPPORT_EVENT, sync);
    return () => window.removeEventListener(SUPPORT_EVENT, sync);
  }, []);

  return (
    <footer className="border-t hairline bg-paper-deep/50">
      {/* 移动端底部预留充足内边距，避开固定导航与悬浮打赏按钮 */}
      <div className="mx-auto max-w-5xl px-6 pt-11 pb-24 md:px-10 md:pb-12">
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

          {/* 法律与合规：紧凑横向文字链（低饱和中性灰，hover 下划线） */}
          <nav aria-label={t('footer.legalHeading')} className="md:pt-0.5">
            <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
              {t('footer.legalHeading')}
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-relaxed">
              {links.map((l, i) => (
                <span key={l.href} className="inline-flex items-center gap-2">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-ink-soft/40">
                      ·
                    </span>
                  )}
                  <a
                    href={l.href}
                    className="text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    {l.label}
                  </a>
                </span>
              ))}
            </p>
            {/* 数据 / 字体许可：收敛为一句，详见方法论页 */}
            <p className="mt-3.5 max-w-md text-[11px] leading-[1.75] text-ink-soft">
              {t('footer.attribution')}{' '}
              <a
                href={`${base}/methodology/`}
                className="text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
              >
                {t('footer.dataSources')}
              </a>
            </p>
          </nav>
        </div>

        {/* 赞助引导（轻量，一行）：用户点击过打赏入口后即可收起 */}
        {!supportEngaged && (
          <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 border-t hairline pt-5 text-[11.5px] leading-relaxed text-ink-soft">
            <p className="max-w-3xl">{t('footer.indieLead')}</p>
            <a
              href="https://ko-fi.com/matthao9701"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('footer.supportAria')}
              onClick={markSupportEngaged}
              className="inline-flex shrink-0 items-center gap-1.5 font-medium text-clay-deep underline-offset-4 transition-colors hover:underline"
            >
              <CoffeeIcon />
              [ {t('footer.indieCta')} ]
            </a>
          </div>
        )}

        {/* 底栏 */}
        <div className="mt-6 flex flex-col gap-2 text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow">
            © {year} 栖居罗盘 · Habitat Compass
          </span>
          <span className="font-mono text-[10px] tracking-wide">{t('footer.note')}</span>
        </div>
      </div>
    </footer>
  );
}
