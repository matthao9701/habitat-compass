import { motion } from 'framer-motion';
import type { AxisName, CityMatch } from '../../lib/engine';
import { personalityCityAnalysis } from '../../lib/analysis';
import { SectionHeading } from './SemBar';
import { useI18n, translate, getCurrentLang } from '../../i18n';
import { cityName } from '../../lib/format';

const ease = [0.22, 1, 0.36, 1] as const;

interface CityAnalysisSectionProps {
  top: CityMatch;
  axisScores: Record<AxisName, number>;
}

/** 三块面板标题（工厂：渲染期取当前语言） */
function panels(): { key: 'ideal' | 'factors' | 'challenges'; title: string; mark: string; note: string }[] {
  const L = (k: string): string => translate(getCurrentLang(), k);
  return [
    { key: 'ideal', title: L('report.cityanalysis.ideal'), mark: '◎', note: L('report.cityanalysis.ideal.hint') },
    { key: 'factors', title: L('report.cityanalysis.factors'), mark: '◇', note: L('report.cityanalysis.factors.hint') },
    { key: 'challenges', title: L('report.cityanalysis.challenges'), mark: '▲', note: L('report.cityanalysis.challenges.hint') },
  ];
}

/** 模块六：人格-环境匹配分析（规则模板生成，不调用外部模型） */
export default function CityAnalysisSection({ top, axisScores }: CityAnalysisSectionProps) {
  const { t } = useI18n();
  const analysis = personalityCityAnalysis(
    axisScores,
    top.city.traits ?? null,
    top.city,
    top.fitDetails,
  );

  return (
    <section className="mx-auto max-w-almanac px-6 pb-4 md:px-10">
      <SectionHeading
        eyebrow="personality × place"
        title={t('an.cityanalysis.title', { name: cityName(top.city) })}
        desc={t('an.cityanalysis.desc')}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease }}
        className="rounded-[10px] border border-clay/45 bg-clay/[0.05] p-6 md:p-8"
      >
        <div className="grid gap-8 md:grid-cols-3">
          {panels().map((panel) => {
            const items = analysis[panel.key];
            const isChallenge = panel.key === 'challenges';
            return (
              <div key={panel.key}>
                <div className="mb-3 flex items-baseline gap-2">
                  <span
                    aria-hidden="true"
                    className={`font-mono text-[13px] ${isChallenge ? 'text-clay' : 'text-ochre-deep'}`}
                  >
                    {panel.mark}
                  </span>
                  <p className="font-heading text-[15px] font-bold text-ink">{panel.title}</p>
                </div>
                <p className="mb-3 font-mono text-[9px] uppercase tracking-eyebrow text-ink-soft/80">
                  {panel.note}
                </p>
                <ul className="space-y-2.5">
                  {items.map((item, i) => (
                    <li
                      key={i}
                      className={`border-l-2 pl-3 text-[12.5px] leading-[1.75] ${
                        isChallenge ? 'border-clay/60 text-[13px] text-ink' : 'border-ochre/50 text-ink'
                      }`}
                    >
                      {t(item)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
