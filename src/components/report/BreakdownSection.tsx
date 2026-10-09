import { motion } from 'framer-motion';
import type { CityMatch } from '../../lib/engine';
import { interestBreakdown, preferenceBreakdown } from '../../lib/analysis';
import { SemBar, SectionHeading } from './SemBar';
import { useI18n } from '../../i18n';
import { cityName } from '../../lib/format';

const ease = [0.22, 1, 0.36, 1] as const;

interface BreakdownSectionProps {
  top: CityMatch;
  userInterests: string[];
}

/** 模块二 + 模块三：兴趣匹配细分 与 生活偏好细分（均针对 Top 1 城市） */
export default function BreakdownSection({ top, userInterests }: BreakdownSectionProps) {
  const { t } = useI18n();
  const interestRows = [...interestBreakdown(userInterests, top.city.tags)].sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });
  const preferenceRows = preferenceBreakdown(top.fitDetails);

  return (
    <section className="mx-auto max-w-almanac px-6 pb-4 md:px-10">
      <SectionHeading
        eyebrow="breakdown · vs top 1"
        title={t('an.breakdown.title', { name: cityName(top.city) })}
        desc={t('an.breakdown.desc')}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {/* 兴趣匹配细分 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="card-paper p-6 md:p-7"
        >
          <div className="mb-5 flex items-baseline justify-between">
            <p className="font-heading text-lg font-semibold">{t('report.breakdown.interests')}</p>
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              {t('an.breakdown.interestFormula')}
            </p>
          </div>
          <div className="space-y-3.5">
            {interestRows.map((row, i) => (
              <SemBar
                key={row.id}
                label={t(row.label)}
                value={row.score ?? 0}
                note={row.score === null ? t('report.breakdown.notSelected') : t('an.breakdown.cell', { sel: row.selectedCount, city: row.cityCount })}
                delay={i * 0.06}
              />
            ))}
          </div>
          <p className="mt-5 border-t hairline pt-3 font-mono text-[9.5px] leading-[1.8] text-ink-soft/80">
            {t('an.breakdown.interestNote')}
          </p>
        </motion.div>

        {/* 生活偏好细分 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="card-paper p-6 md:p-7"
        >
          <div className="mb-5 flex items-baseline justify-between">
            <p className="font-heading text-lg font-semibold">{t('report.breakdown.lifestyle')}</p>
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              {t('an.breakdown.prefEyebrow')}
            </p>
          </div>
          <div className="space-y-3.5">
            {preferenceRows.map((row, i) => (
              <SemBar key={row.key} label={t(row.label)} value={row.score} delay={i * 0.05} />
            ))}
          </div>
          <p className="mt-5 border-t hairline pt-3 font-mono text-[9.5px] leading-[1.8] text-ink-soft/80">
            {t('an.breakdown.prefNote')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
