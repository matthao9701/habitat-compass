import { motion } from 'framer-motion';
import type { CityMatch } from '../../lib/engine';
import { interestBreakdown, preferenceBreakdown } from '../../lib/analysis';
import { SemBar, SectionHeading } from './SemBar';

const ease = [0.22, 1, 0.36, 1] as const;

interface BreakdownSectionProps {
  top: CityMatch;
  userInterests: string[];
}

/** 模块二 + 模块三：兴趣匹配细分 与 生活偏好细分（均针对 Top 1 城市） */
export default function BreakdownSection({ top, userInterests }: BreakdownSectionProps) {
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
        title={`细分拆解 · ${top.city.nameZh} 为什么排第一`}
        desc="把加权总分拆到兴趣与偏好两个维度，逐项对照 Top 1 城市的真实数据。"
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
            <p className="font-serif text-lg font-medium">兴趣匹配细分</p>
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              精度 70% + 召回 30%
            </p>
          </div>
          <div className="space-y-3.5">
            {interestRows.map((row, i) => (
              <SemBar
                key={row.id}
                label={row.label}
                value={row.score ?? 0}
                note={row.score === null ? '未选择' : `选 ${row.selectedCount} · 城 ${row.cityCount}`}
                delay={i * 0.06}
              />
            ))}
          </div>
          <p className="mt-5 border-t hairline pt-3 font-mono text-[9.5px] leading-[1.8] text-ink-soft/80">
            「选」= 你勾选的该类标签数，「城」= 该城拥有的该类标签数；未选择类别不参与计分。
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
            <p className="font-serif text-lg font-medium">生活偏好细分</p>
            <p className="font-mono text-[9.5px] uppercase tracking-eyebrow text-ink-soft">
              8 维 · 序数距离
            </p>
          </div>
          <div className="space-y-3.5">
            {preferenceRows.map((row, i) => (
              <SemBar key={row.key} label={row.label} value={row.score} delay={i * 0.05} />
            ))}
          </div>
          <p className="mt-5 border-t hairline pt-3 font-mono text-[9.5px] leading-[1.8] text-ink-soft/80">
            得分由你的情景选择与该城真实数据逐维比对得出；居住成本随预算档位以惩罚函数计。
          </p>
        </motion.div>
      </div>
    </section>
  );
}
