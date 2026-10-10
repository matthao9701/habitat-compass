import { motion } from 'framer-motion';
import type { CityMatch } from '../../lib/engine';
import { realityLedger } from '../../lib/reportDeep';
import { SectionHeading } from './SemBar';
import { useI18n } from '../../i18n';
import { cityName, formatMoneyShort } from '../../lib/format';
import { visaLabelText } from '../../i18n/countryGlossary';

const ease = [0.22, 1, 0.36, 1] as const;

interface LedgerSectionProps {
  top: CityMatch;
}

/**
 * 第四层 · 现实落地账本：
 * 把画像落到「要花的钱」与「要踩的时间点」——月度成本（合租 / 一居室 / 月均）、
 * 与核心协作方（北京 / 伦敦）的黄金重叠办公小时、数字游民签证与居留门槛。
 * 全部取自城市库真实字段，缺数据显示「—」而非编造。
 */
export default function LedgerSection({ top }: LedgerSectionProps) {
  const { t } = useI18n();
  const { city } = top;
  const ledger = realityLedger(city);

  const costRows: { label: string; value: number | null }[] = [
    { label: t('rep.ledger.cost.shareRoom'), value: ledger.cost.shareRoom },
    { label: t('rep.ledger.cost.solo'), value: ledger.cost.solo },
    { label: t('rep.ledger.cost.avg'), value: ledger.cost.avg },
  ];

  const overlaps: { label: string; hours: number | null }[] = [
    { label: t('rep.ledger.overlap.beijing'), hours: ledger.overlapBeijing },
    { label: t('rep.ledger.overlap.london'), hours: ledger.overlapLondon },
  ];

  const visaText =
    ledger.digitalNomadVisa === true
      ? t('rep.ledger.visa.dnYes')
      : ledger.digitalNomadVisa === false
        ? t('rep.ledger.visa.dnNo')
        : t('rep.ledger.visa.pending');

  return (
    <section className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-16">
      <SectionHeading
        eyebrow={t('rep.ledger.eyebrow')}
        title={t('rep.ledger.title', { name: cityName(city) })}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease }}
        className="card-paper overflow-hidden"
      >
        <div className="grid gap-px bg-line md:grid-cols-3">
          {/* 月度成本 */}
          <div className="bg-card p-6 md:p-7">
            <p className="mb-4 font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              {t('rep.ledger.cost.title')}
            </p>
            <dl className="space-y-3">
              {costRows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[12.5px] text-ink-soft">{row.label}</dt>
                  <dd className="font-data text-[14px] tabular-nums text-ink">
                    {row.value != null ? formatMoneyShort(row.value) : '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 黄金重叠办公时间 */}
          <div className="bg-card p-6 md:p-7">
            <p className="mb-4 font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              {t('rep.ledger.overlap.title')}
            </p>
            <dl className="space-y-3">
              {overlaps.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[12.5px] text-ink-soft">{row.label}</dt>
                  <dd className="font-data text-[14px] tabular-nums text-ink">
                    {row.hours != null ? t('rep.ledger.overlap.hours', { h: row.hours }) : '—'}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t hairline pt-3 font-mono text-[10px] leading-[1.8] text-ink-soft/80">
              {t('rep.ledger.overlap.desc')}
            </p>
          </div>

          {/* 签证与居留门槛 */}
          <div className="bg-card p-6 md:p-7">
            <p className="mb-4 font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              {t('rep.ledger.visa.title')}
            </p>
            <p
              className={`text-[13px] leading-[1.85] ${
                ledger.digitalNomadVisa === true ? 'text-moss-deep' : 'text-ink'
              }`}
            >
              {visaText}
            </p>
            {city.visaLabel ? (
              <p className="mt-3 border-t hairline pt-3 text-[12px] leading-[1.7] text-ink-soft">
                {visaLabelText(city.visaLabel)}
              </p>
            ) : null}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
