import { motion } from 'framer-motion';
import type { CityMatch } from '../../lib/engine';
import { trialPlan } from '../../lib/analysis';
import { useI18n } from '../../i18n';
import { SectionHeading } from './SemBar';
import { cityName } from '../../lib/format';

const ease = [0.22, 1, 0.36, 1] as const;

interface TrialSectionProps {
  top: CityMatch;
}

const GROUP_MARKS = ['△', '◈', '☰'];

/** 模块七：先试住再决定——行动建议卡（预算与清单均由该城真实数据折算） */
export default function TrialSection({ top }: TrialSectionProps) {
  const { t } = useI18n();
  const plan = trialPlan(top.match, top.city);

  return (
    <section className="mx-auto max-w-almanac px-6 pb-4 md:px-10">
      <SectionHeading
        eyebrow="try before you decide"
        title={t('an.trial.title', { name: cityName(top.city) })}
        desc={t('an.trial.desc')}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease }}
        className="card-paper p-6 md:p-8"
      >
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-b hairline pb-5">
          <p className="font-mono text-[13px] text-clay">
            {t('an.trial.days', { days: plan.days })}
          </p>
          <p className="max-w-xl flex-1 text-[13.5px] leading-[1.8] text-ink">{t(plan.intro)}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {plan.checklist.map((group, gi) => (
            <div key={group.title}>
              <div className="mb-3 flex items-baseline gap-2">
                <span aria-hidden="true" className="font-mono text-[13px] text-pine">
                  {GROUP_MARKS[gi] ?? '·'}
                </span>
                <p className="font-heading text-[15px] font-bold">{t(group.title)}</p>
              </div>
              <ul className="space-y-2.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[12.5px] leading-[1.75] text-ink-soft">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ochre" />
                    <span className="text-ink">{t(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 border-t hairline pt-4 font-mono text-[9.5px] leading-[1.8] text-ink-soft/80">
          {t('an.trial.note')}
        </p>
      </motion.div>
    </section>
  );
}
