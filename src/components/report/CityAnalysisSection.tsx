import { motion } from 'framer-motion';
import type { AxisName, CityMatch } from '../../lib/engine';
import { personalityCityAnalysis } from '../../lib/analysis';
import { SectionHeading } from './SemBar';

const ease = [0.22, 1, 0.36, 1] as const;

interface CityAnalysisSectionProps {
  top: CityMatch;
  axisScores: Record<AxisName, number>;
}

const PANELS: { key: 'ideal' | 'factors' | 'challenges'; title: string; mark: string; note: string }[] = [
  { key: 'ideal', title: '理想环境特征', mark: '◎', note: '按你最强的人格倾向生成' },
  { key: 'factors', title: '关键匹配因素', mark: '◇', note: '人格向量 × 城市气质同频项' },
  { key: 'challenges', title: '潜在挑战', mark: '▲', note: '橙卡提示，供试住期重点验证' },
];

/** 模块六：人格-环境匹配分析（规则模板生成，不调用外部模型） */
export default function CityAnalysisSection({ top, axisScores }: CityAnalysisSectionProps) {
  const analysis = personalityCityAnalysis(
    axisScores,
    top.city.traits,
    top.city,
    top.fitDetails,
  );

  return (
    <section className="mx-auto max-w-almanac px-6 pb-4 md:px-10">
      <SectionHeading
        eyebrow="personality × place"
        title={`你的人格 × ${top.city.nameZh}`}
        desc="Top 1 城市与你的四维人格倾向逐轴对照——同频处是理由，错位处写进试住清单。"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease }}
        className="rounded-[10px] border border-clay/45 bg-clay/[0.05] p-6 md:p-8"
      >
        <div className="grid gap-8 md:grid-cols-3">
          {PANELS.map((panel) => {
            const items = analysis[panel.key];
            const isChallenge = panel.key === 'challenges';
            return (
              <div key={panel.key}>
                <div className="mb-3 flex items-baseline gap-2">
                  <span
                    aria-hidden="true"
                    className={`font-mono text-[13px] ${isChallenge ? 'text-clay' : 'text-ochre'}`}
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
                      {item}
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
