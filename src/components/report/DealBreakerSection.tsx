import { motion } from 'framer-motion';
import type { AssessmentResult } from '../../lib/engine';
import { bestEnvironments, dealbreakers } from '../../lib/reportDeep';
import { SectionHeading } from './SemBar';
import { useI18n } from '../../i18n';
import { cityName } from '../../lib/format';
import { isMbtiTypeCode } from '../../data/mbtiProfiles';

const ease = [0.22, 1, 0.36, 1] as const;

interface DealBreakerSectionProps {
  result: AssessmentResult;
}

/**
 * 第二层 · 核心决策张力与雷区警示：
 * 左「最佳赋能环境」（人格环境 × 城市真实数据），右「致命摩擦力」：
 * 上半为原型专属避坑标签（type.<CODE>.deal.0/1），下半为按现实优先级派生的 2 条摩擦力。
 * 敢于指出不适合去哪里，是专业度与「被击中感」的关键。
 */
export default function DealBreakerSection({ result }: DealBreakerSectionProps) {
  const { t } = useI18n();
  const top = result.matches[0];
  if (!top) return null;

  const enablers = bestEnvironments(result.axisScores, top.city);
  const avoids = dealbreakers(result.axisScores, result.preferences);

  // 原型专属避坑标签（t() 对缺失键返回键本身，据此过滤）
  const code = result.typeCode;
  const typeDeals = isMbtiTypeCode(code)
    ? [0, 1]
        .map((i) => t(`type.${code}.deal.${i}`))
        .filter((v, i) => v && v !== `type.${code}.deal.${i}`)
    : [];

  return (
    <section className="border-y hairline bg-paper-deep/40">
      <div className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-16">
        <SectionHeading
          eyebrow={t('rep.deal.eyebrow')}
          title={t('rep.deal.title')}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {/* 最佳赋能环境 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="card-paper border-l-2 !border-l-moss-deep p-6 md:p-7"
          >
            <p className="mb-4 font-mono text-[9.5px] uppercase tracking-eyebrow text-moss-deep">
              {t('rep.deal.best')}
            </p>
            <ul className="space-y-3">
              {enablers.map((key, i) => (
                <li key={`en-${i}`} className="flex gap-3 text-[13.5px] leading-[1.8]">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-moss" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 致命摩擦力 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08, ease }}
            className="card-paper border-l-2 !border-l-clay-deep p-6 md:p-7"
          >
            <p className="mb-4 font-mono text-[9.5px] uppercase tracking-eyebrow text-clay-deep">
              {t('rep.deal.avoid')}
            </p>
            <p className="mb-4 text-[12.5px] leading-relaxed text-ink-soft">
              {t('rep.deal.avoidHint')}
            </p>
            {typeDeals.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {typeDeals.map((d, i) => (
                  <span
                    key={`td-${i}`}
                    className="rounded-full border border-clay/45 bg-clay/[0.07] px-3 py-1 font-mono text-[11px] text-clay-deep"
                  >
                    {d}
                  </span>
                ))}
              </div>
            ) : null}
            <ul className="space-y-3">
              {avoids.map((key, i) => (
                <li key={`av-${i}`} className="flex gap-3 text-[13.5px] leading-[1.8] text-ink">
                  <span className="shrink-0 font-mono text-clay-deep">✕</span>
                  {t(key)}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t hairline pt-3 font-mono text-[10px] leading-[1.8] text-ink-soft/80">
              {t('rep.tier.baseline.desc')} · {cityName(top.city)}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
