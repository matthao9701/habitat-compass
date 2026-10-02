import { motion } from 'framer-motion';
import type { CityMatch } from '../../lib/engine';
import { trialPlan } from '../../lib/analysis';
import { SectionHeading } from './SemBar';

const ease = [0.22, 1, 0.36, 1] as const;

interface TrialSectionProps {
  top: CityMatch;
}

const GROUP_MARKS = ['△', '◈', '☰'];

/** 模块七：先试住再决定——行动建议卡（预算与清单均由该城真实数据折算） */
export default function TrialSection({ top }: TrialSectionProps) {
  const plan = trialPlan(top.match, top.city);

  return (
    <section className="mx-auto max-w-almanac px-6 pb-4 md:px-10">
      <SectionHeading
        eyebrow="try before you decide"
        title={`先试住，再决定要不要停靠 ${top.city.nameZh}`}
        desc="报告给的是概率，不是保证。用一次短期停靠验证关键假设。"
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
            建议 {plan.days}
          </p>
          <p className="max-w-xl flex-1 text-[13.5px] leading-[1.8] text-ink">{plan.intro}</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {plan.checklist.map((group, gi) => (
            <div key={group.title}>
              <div className="mb-3 flex items-baseline gap-2">
                <span aria-hidden="true" className="font-mono text-[13px] text-pine">
                  {GROUP_MARKS[gi] ?? '·'}
                </span>
                <p className="font-serif text-[15px] font-medium">{group.title}</p>
              </div>
              <ul className="space-y-2.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[12.5px] leading-[1.75] text-ink-soft">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ochre" />
                    <span className="text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 border-t hairline pt-4 font-mono text-[9.5px] leading-[1.8] text-ink-soft/80">
          预算按月均综合成本 ÷ 30 × 试住天数中值折算，未含国际机票；签证停留上限以官方最新信息为准。
        </p>
      </motion.div>
    </section>
  );
}
