import type { Country, PassportCode } from '../../data/types';
import { useI18n } from '../../i18n';
import { loadPassport } from '../../lib/storage';

/**
 * PassportVisaBlock / LongStayBlock — 第九轮共享展示块
 * 报告页国家概况卡（CountryCards）与对比页城市详情弹层（CityDetailModal）共用。
 * 参考信息层：不进引擎加权；护照免签快照目前仅覆盖中国大陆护照（CN）。
 */

/** 入境待遇徽标语义色（免签=绿 / 落地签=蓝 / eVisa=金 / 需签=珊瑚） */
const ENTRY_STYLE: Record<string, string> = {
  visaFree: 'bg-moss/10 text-moss',
  visaOnArrival: 'bg-sea/10 text-sea',
  eVisa: 'bg-ochre/15 text-ochre',
  visaRequired: 'bg-clay/10 text-clay',
};

/** 签证适用性等级语义色（friendly=绿 / restricted=蓝 / unknown=灰） */
const LEVEL_STYLE: Record<string, string> = {
  friendly: 'bg-moss/10 text-moss',
  restricted: 'bg-sea/10 text-sea',
  unknown: 'bg-ink-soft/10 text-ink-soft',
};

export function PassportVisaBlock({ country }: { country: Country }) {
  const { t } = useI18n();
  const passport: PassportCode = loadPassport();
  const snap = passport === 'CN' ? country.visaPassport : null;

  return (
    <div className="mt-4 rounded-[6px] bg-paper-deep/70 px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
          {t('pv.title')}
        </p>
        <span className="rounded-full border border-line bg-card px-2 py-0.5 text-[10.5px] font-medium text-ink">
          {t(`passport.${passport}`)}
        </span>
      </div>

      {snap ? (
        <>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${ENTRY_STYLE[snap.entry]}`}
            >
              {t(`pv.entry.${snap.entry}`)}
            </span>
            {snap.entryNote ? (
              <span className="text-[11.5px] leading-snug text-ink-soft">{snap.entryNote}</span>
            ) : null}
          </div>

          <dl className="mt-3 space-y-1.5">
            {(
              [
                { key: 'work', label: t('pv.work') },
                { key: 'digitalNomad', label: t('pv.digitalNomad') },
                { key: 'longTerm', label: t('pv.longTerm') },
              ] as const
            ).map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-3 text-[12px]">
                <dt className="text-ink-soft">{row.label}</dt>
                <dd>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
                      LEVEL_STYLE[snap[row.key]] ?? LEVEL_STYLE.unknown
                    }`}
                  >
                    {t(`pv.level.${snap[row.key]}`)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="mt-2 text-[12px] leading-[1.7] text-ink-soft">{t('pv.fallback')}</p>
      )}

      <p className="mt-2.5 border-t hairline pt-2 font-mono text-[9px] leading-[1.8] text-ink-soft/75">
        {t('pv.disclaimer')}
        {snap ? `（${t('pv.snapshot', { date: snap.snapshotDate })}）` : ''}
      </p>
    </div>
  );
}

export function LongStayBlock({ country }: { country: Country }) {
  const { t } = useI18n();
  const ls = country.longStay;

  return (
    <div className="mt-3 rounded-[6px] bg-paper-deep/70 px-4 py-3.5">
      <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
        {t('longstay.title')}
      </p>
      {ls ? (
        <dl className="mt-2.5 space-y-1.5 text-[12px] leading-[1.7]">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="shrink-0 text-ink-soft">{t('longstay.taxDaysLabel')}</dt>
            <dd className="font-data tabular-nums text-ink">
              {ls.taxResidencyDays != null
                ? t('longstay.taxDays', { days: ls.taxResidencyDays })
                : '—'}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="shrink-0 text-ink-soft">{t('longstay.ssLabel')}</dt>
            <dd className="text-ink">
              {ls.socialSecurityCn ? t(`longstay.ss.${ls.socialSecurityCn}`) : '—'}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <dt className="shrink-0 text-ink-soft">{t('longstay.rentalLabel')}</dt>
            <dd className="text-ink">{ls.rentalCustom ?? '—'}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-[12px] leading-[1.7] text-ink-soft">{t('longstay.none')}</p>
      )}
      <p className="mt-2.5 border-t hairline pt-2 font-mono text-[9px] leading-[1.8] text-ink-soft/75">
        {t('longstay.verify')}
      </p>
    </div>
  );
}
