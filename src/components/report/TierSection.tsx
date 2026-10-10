import { motion } from 'framer-motion';
import type { CityMatch } from '../../lib/engine';
import { recommendTiers } from '../../lib/reportDeep';
import { SectionHeading } from './SemBar';
import { useI18n } from '../../i18n';
import { cityName, cityCountryName, formatMoneyShort } from '../../lib/format';

const ease = [0.22, 1, 0.36, 1] as const;

interface TierSectionProps {
  /** 完整排序城市列表（结果池；缺省时回退 Top5） */
  allMatches: CityMatch[];
}

interface TierDef {
  key: 'baseline' | 'value' | 'surprise';
  match: CityMatch | null;
  tone: string;
}

/**
 * 第三层 · 加权推荐梯队：
 * 基准天命之选（最优解）/ 高性价比备选（省钱换自由）/ 探索性惊喜之选（冷门偏好命中）。
 * 三档并置，兼顾「理性最优」与「意料之外」，是报告从诊断走向行动的关键层。
 */
export default function TierSection({ allMatches }: TierSectionProps) {
  const { t } = useI18n();
  const tiers = recommendTiers(allMatches);
  if (!tiers) return null;

  const defs: TierDef[] = [
    { key: 'baseline', match: tiers.baseline, tone: 'border-ink/25 bg-ink text-paper' },
    { key: 'value', match: tiers.value, tone: 'border-moss-deep/45 bg-moss/[0.06]' },
    { key: 'surprise', match: tiers.surprise, tone: 'border-ochre-deep/45 bg-ochre/[0.07]' },
  ];

  return (
    <section className="border-y hairline bg-paper-deep/40">
      <div className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-16">
        <SectionHeading eyebrow={t('rep.tier.eyebrow')} title={t('rep.tier.title')} />
        <div className="grid gap-5 lg:grid-cols-3">
          {defs.map((def, i) => {
            if (!def.match) return null;
            const { city, match } = def.match;
            const isBaseline = def.key === 'baseline';
            return (
              <motion.article
                key={def.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease }}
                className={`rounded-[10px] border p-6 md:p-7 ${def.tone}`}
              >
                <p
                  className={`font-mono text-[10px] uppercase tracking-eyebrow ${
                    isBaseline ? 'text-paper/55' : 'text-ink-soft'
                  }`}
                >
                  {t(`rep.tier.${def.key}.label`)}
                </p>
                <h3
                  className={`mt-3 font-display text-[24px] font-semibold leading-tight tracking-tight ${
                    isBaseline ? 'text-paper' : 'text-ink'
                  }`}
                >
                  {cityName(city)}
                </h3>
                <p
                  className={`mt-1 font-mono text-[10.5px] uppercase tracking-wide ${
                    isBaseline ? 'text-paper/45' : 'text-ink-soft'
                  }`}
                >
                  {cityCountryName(city)} · {t('rep.tier.match', { n: match })}
                </p>
                <p
                  className={`mt-4 text-[13px] leading-[1.85] ${
                    isBaseline ? 'text-paper/75' : 'text-ink-soft'
                  }`}
                >
                  {t(`rep.tier.${def.key}.desc`)}
                </p>

                <div
                  className={`mt-5 border-t pt-3 font-mono text-[10.5px] ${
                    isBaseline ? 'border-paper/15 text-paper/60' : 'border-line text-ink-soft'
                  }`}
                >
                  <span>
                    {t('rep.stat.avgAll')} {city.monthlyCostUSD != null ? `~${formatMoneyShort(city.monthlyCostUSD)}` : '—'}
                  </span>
                  {def.key === 'value' && tiers.valueSavedUSD != null ? (
                    <span className="ml-3 text-moss-deep">
                      {t('rep.tier.save', { usd: `$${tiers.valueSavedUSD.toLocaleString('en-US')}` })}
                    </span>
                  ) : null}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
