import { motion } from 'framer-motion';
import RadarChart from '../RadarChart';
import type { AssessmentResult } from '../../lib/engine';
import type { RiasecProfile, RiskProfile } from '../../lib/riasec';
import { riskBandOf } from '../../lib/riasec';
import { RIASEC_DIMS } from '../../data/riasec';
import { RIASEC_TAG_BOOST } from '../../data/riasecMap';
import { useI18n } from '../../i18n';
import { CHART_COLORS } from '../../lib/colors';

/**
 * 第八轮报告增强：RIASEC 兴趣画像（六维雷达 + Top2 组合解读 + 标签联动）
 * + IPIP Risk-Taking 风险偏好卡。均为画像展示层，不进引擎加权。
 */

const RIASEC_BOOST_THRESHOLD = 60;

export default function RiasecSection({
  result,
  profile,
  risk,
}: {
  result: AssessmentResult;
  profile: RiasecProfile;
  risk: RiskProfile | null;
}) {
  const { t } = useI18n();

  const axes = RIASEC_DIMS.map((d) => t(`riasec.dim.${d}`));
  const series = [
    {
      id: 'riasec',
      label: t('riasec.radar.label'),
      color: CHART_COLORS.deepSea,
      values: RIASEC_DIMS.map((d) => profile.percent[d]),
    },
  ];

  // RIASEC 高分维强化的已选标签（联动展示）
  const boosted: string[] = [];
  for (const dim of RIASEC_DIMS) {
    if (profile.percent[dim] < RIASEC_BOOST_THRESHOLD) continue;
    for (const tag of RIASEC_TAG_BOOST[dim]) {
      if (result.interests.includes(tag) && !boosted.includes(tag)) boosted.push(tag);
    }
  }

  return (
    <section className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-20">
      <p className="eyebrow mb-3">{t('riasec.section.eyebrow')}</p>
      <h2 className="mb-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
        {t('riasec.section.title')}
      </h2>
      <p className="mb-10 max-w-[640px] text-[13.5px] leading-[1.9] text-ink-soft">
        {t('riasec.section.desc')}
      </p>

      <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* 六维雷达 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[14px] border hairline bg-card p-6"
        >
          <RadarChart axes={axes} series={series} size={300} />
          <p className="mt-3 text-center font-mono text-[9.5px] text-ink-soft/80">
            {t('riasec.radar.note')}
          </p>
        </motion.div>

        {/* 兴趣画像卡：Top2 组合 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4"
        >
          <div className="rounded-[14px] border hairline bg-card p-6">
            <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-ochre-deep">
              {t('riasec.combo.eyebrow', { combo: profile.combo })}
            </p>
            <h3 className="mb-3 font-heading text-lg font-semibold">
              {t(`riasec.combo.${profile.combo}.name`)}
            </h3>
            <p className="text-[13.5px] leading-[1.9] text-ink-soft">
              {t(`riasec.combo.${profile.combo}.desc`)}
            </p>
          </div>

          {/* 标签联动 */}
          <div className="rounded-[14px] border hairline bg-card p-6">
            <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-ochre-deep">
              {t('riasec.link.eyebrow')}
            </p>
            {boosted.length > 0 ? (
              <>
                <p className="text-[13.5px] leading-[1.9] text-ink">
                  {t('riasec.link', { tags: boosted.map((tag) => t(`tag.${tag}`)).join(t('riasec.tagSep')) })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {boosted.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-moss-deep/50 bg-moss/10 px-3 py-1 text-[12px] font-medium text-moss-deep"
                    >
                      {t(`tag.${tag}`)}
                    </span>
                  ))}
                </div>
                <p className="mt-3 font-mono text-[9.5px] leading-[1.8] text-ink-soft/80">
                  {t('riasec.link.note')}
                </p>
              </>
            ) : (
              <p className="text-[13.5px] leading-[1.9] text-ink-soft">
                {t('riasec.linkNone')}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* 风险偏好卡（IPIP Risk-Taking，仅画像展示） */}
      {risk ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-[14px] border hairline bg-card p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 font-mono text-[10px] tracking-[0.18em] text-ochre-deep">
                {t('risk.card.eyebrow')}
              </p>
              <h3 className="font-heading text-lg font-semibold">{t('risk.card.title')}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9.5px] text-ink-soft">{t('risk.card.score')}</span>
              <span className="font-data text-2xl font-semibold tabular-nums">{risk.score}</span>
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                  risk.band === 'high'
                    ? 'bg-moss/10 text-moss-deep'
                    : risk.band === 'mid'
                      ? 'bg-sea/10 text-sea-deep'
                      : 'bg-ink-soft/10 text-ink-soft'
                }`}
              >
                {t(`risk.band.${risk.band}`)}
              </span>
            </div>
          </div>
          <p className="mt-3 text-[13.5px] leading-[1.9] text-ink-soft">
            {t(`risk.band.${risk.band}.desc`)}
          </p>
          <p className="mt-3 font-mono text-[9.5px] leading-[1.8] text-ink-soft/80">
            {t('risk.card.desc')}
          </p>
        </motion.div>
      ) : null}
    </section>
  );
}
