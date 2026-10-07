import { useState } from 'react';
import type { ExcludedEntry } from '../../lib/constraints';
import { useI18n, getCurrentLang } from '../../i18n';
import { cityNameById } from '../../lib/format';

/**
 * ConstraintsNotice — 报告页顶部的硬性条件过滤说明（第六轮）
 * 「已按你的硬性条件排除 N 座城市」，可展开查看逐城原因；保证过滤可解释。
 */
export default function ConstraintsNotice({
  excluded,
  relaxed,
  overBudgetCount,
  passportSkipped = false,
}: {
  excluded: ExcludedEntry[];
  relaxed: boolean;
  overBudgetCount: number;
  /** 第九轮：免签优先档因所选护照无快照而降级不过滤时置 true，需在排除说明中标注 */
  passportSkipped?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const en = getCurrentLang() === 'en';

  return (
    <section className="border-b hairline bg-clay/[0.06]">
      <div className="mx-auto max-w-almanac px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* 几何漏斗图标 */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="mt-0.5 shrink-0 text-clay">
              <path d="M3 4h14l-5.5 6.5V16l-3-1.8v-3.7L3 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-[13.5px] font-medium leading-snug text-ink">
                {t('cn.head1')} <span className="font-data text-clay">{excluded.length}</span> {t('cn.head2')}
                {overBudgetCount > 0 ? (
                  <>{t('cn.relaxed1')} <span className="font-data text-ochre-deep">{overBudgetCount}</span> {t('cn.relaxed2')}</>
                ) : null}
              </p>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-ink-soft">
                {t('cn.rule')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 font-mono text-[10.5px] text-clay underline-offset-4 hover:underline"
          >
            {open ? t('repnot.collapse') : t('repnot.expand')}
          </button>
        </div>

        {open ? (
          <ul className="mt-4 grid gap-x-8 gap-y-2 border-t hairline pt-4 sm:grid-cols-2">
            {excluded.map((e) => (
              <li key={e.cityId} className="flex items-baseline gap-2 text-[12px] leading-[1.7]">
                <span className="shrink-0 font-medium text-ink">{cityNameById(e.cityId, e.nameZh)}</span>
                <span className="font-mono text-[10px] text-ink-soft">{en ? (e.countryEn ?? e.countryZh) : e.countryZh}</span>
                <span className="text-ink-soft">— {en ? t(e.reasonKey, e.reasonVars) : e.reason}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {relaxed ? (
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-ink-soft">
            {t('cn.relaxedRule')}
          </p>
        ) : null}

        {passportSkipped ? (
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink-soft">
            {t('cn.passportSkipped')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
