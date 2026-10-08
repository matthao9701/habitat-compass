import { useState } from 'react';
import { motion } from 'framer-motion';
import CompassMark from './CompassMark';
import { AtlasCard, CityDrawer } from './atlas/AtlasCard';
import SentenceFilter, { DEFAULT_FILTER, filterCities, type FilterState } from './atlas/SentenceFilter';
import { cities } from '../data';
import { DEMO_PROFILES } from '../data/demoProfiles';
import { REGION_ORDER } from '../data/regions';
import { formatMoney } from '../lib/format';
import type { City } from '../data/types';
import { useI18n, translate, getCurrentLang } from '../i18n';

interface LandingProps {
  onStart: () => void;
  onDemo: (profileId: string) => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** 痛点 / 流程步骤（工厂：渲染期取当前语言） */
function painPoints(): { no: string; title: string; desc: string }[] {
  const L = (k: string): string => translate(getCurrentLang(), k);
  return [
    { no: '01', title: L('landing.pain1.title'), desc: L('landing.pain1.desc') },
    { no: '02', title: L('landing.pain2.title'), desc: L('landing.pain2.desc') },
    { no: '03', title: L('landing.pain3.title'), desc: L('landing.pain3.desc') },
  ];
}

function steps(): { no: string; title: string; desc: string }[] {
  const L = (k: string): string => translate(getCurrentLang(), k);
  return [
    { no: '01', title: L('landing.step1.title'), desc: L('landing.step1.desc') },
    { no: '02', title: L('landing.step2.title'), desc: L('landing.step2.desc') },
    { no: '03', title: L('landing.step3.title'), desc: L('landing.step3.desc') },
  ];
}

export default function Landing({ onStart, onDemo }: LandingProps) {
  const { t } = useI18n();
  const [atlasRegion, setAtlasRegion] = useState<string>('all');
  /** 编辑部风改版：首屏句子过滤器 + 画册卡片 + 速览抽屉 */
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [drawerCity, setDrawerCity] = useState<City | null>(null);
  const filteredCities = filterCities(cities, filter);

  return (
    <div className="grain min-h-screen bg-paper text-ink">
      {/* 顶部导航 */}
      <header className="mx-auto flex max-w-almanac items-center justify-between gap-3 px-5 py-6 sm:px-6 md:px-10">
        <div className="flex min-w-0 items-center gap-3 text-ink">
          <CompassMark size={32} />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-[15px] font-bold tracking-wide sm:text-[17px]">{t('landing.hero.title')}</p>
            <p className="hidden font-mono text-[9px] uppercase tracking-eyebrow text-ink-soft sm:block">
              overseas almanac
            </p>
          </div>
        </div>
        <button type="button" onClick={onStart} className="btn-clay shrink-0 !px-4 !py-2.5 text-sm sm:!px-6">
          {t('nav.startQuiz')}
        </button>
      </header>

      {/* Hero —— 编辑部风：衬线大标题 + 留白 + 一句话过滤器 */}
      <section className="mx-auto max-w-almanac px-6 pb-10 pt-8 md:px-10 md:pb-14 md:pt-14">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="eyebrow mb-6"
        >
          {t('landing.hero.vol')}
        </motion.p>
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="max-w-3xl font-display text-[32px] font-medium leading-[1.16] tracking-tight sm:text-[38px] md:text-[64px] md:leading-[1.14]"
        >
          {t('landing.hero.l1')}
          <br />
          {t('landing.hero.l2a')}<span className="italic text-clay">{t('landing.hero.lead')}</span>{t('landing.hero.l2b')}
          <br />
          {t('landing.hero.l3')}
        </motion.h1>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="font-data text-[11px] uppercase tracking-[0.28em] text-ink-soft">
            habitat compass — field almanac for the deliberate mover
          </p>
        </div>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-5 max-w-xl text-[15px] leading-[1.9] text-ink-soft"
        >
          {t('landing.hero.desc1')}
          {t('landing.hero.desc2')}
        </motion.p>

        {/* 首屏轻量过滤器：一句话自然填空 + 微调滑块 */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-9"
        >
          <SentenceFilter
            value={filter}
            onChange={setFilter}
            matchedCount={filteredCities.length}
            totalCount={cities.length}
          />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mt-7"
        >
          {/* 微标置于主按钮上方：先降低心理门槛，再给出行动点 */}
          <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-2">
            {[
              t('landing.cta.badgeTime'),
              t('landing.cta.badgeQuestions'),
              t('landing.cta.badgeNoSignup'),
            ].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border hairline bg-card px-2.5 py-1 font-data text-[10.5px] text-ink-soft"
              >
                <span className="h-1 w-1 rounded-full bg-moss" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={onStart} className="btn-clay flex-1 sm:flex-none">
              {t('landing.hero.cta')}
              <span className="font-data text-xs opacity-80">→</span>
            </button>
            <button
              type="button"
              onClick={() => onDemo(DEMO_PROFILES[0]?.id ?? '')}
              className="btn-ghost flex-1 !text-[13px] sm:flex-none"
            >
              {t('landing.hero.sampleCta')}
            </button>
          </div>
        </motion.div>
      </section>

      {/* 刊头统计条：极简单行，等宽数字 */}
      <section className="border-y border-line">
        <div className="mx-auto grid max-w-almanac grid-cols-2 divide-x divide-line px-0 md:grid-cols-4">
          {[
            ['200', t('landing.stat.cities')],
            ['6', t('landing.stat.continents')],
            ['65', t('landing.stat.dataFiles')],
            ['0', t('landing.stat.threshold')],
          ].map(([v, l]) => (
            <div key={l} className="px-6 py-5 md:px-10">
              <p className="font-data text-[26px] font-medium leading-none text-ink">{v}</p>
              <p className="mt-1.5 font-data text-[9.5px] uppercase tracking-[0.18em] text-ink-soft">
                {l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 快速体验 · 演示档案 */}
      <section className="border-y hairline bg-card/50">
        <div className="mx-auto max-w-almanac px-6 py-14 md:px-10 md:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">quick preview · 10 seconds</p>
              <h2 className="font-display text-2xl font-bold leading-snug tracking-tight md:text-3xl">
                {t('landing.demo.title')}
              </h2>
            </div>
            <p className="font-mono text-[11px] text-ink-soft">
              {t('landing.demo.hint')}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {DEMO_PROFILES.map((profile, index) => (
              <motion.button
                key={profile.id}
                type="button"
                onClick={() => onDemo(profile.id)}
                whileTap={{ scale: 0.985 }}
                className="group rounded-[10px] border hairline bg-card p-5 text-left transition-all duration-300 hover:border-clay/55 hover:shadow-[0_6px_24px_rgba(31,45,40,0.08)] md:p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                    demo {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-xs text-clay opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {t('landing.demo.cta')}
                  </span>
                </div>
                <p className="font-heading text-lg font-bold text-ink">{t(`demo.${profile.id}.label`)}</p>
                <p className="mt-1.5 font-mono text-[11px] text-ochre-deep">{t(`demo.${profile.id}.tagline`)}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{t(`demo.${profile.id}.desc`)}</p>
                <div className="mt-4 flex items-center justify-between border-t hairline pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                    {t('landing.demo.expected')} {profile.expectedType}
                  </span>
                  <span className="font-mono text-[10px] text-ink-soft">{t('landing.stat.thresholdValue')}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* 痛点 */}
      <section className="border-y hairline bg-paper-deep/60">
        <div className="mx-auto max-w-almanac px-6 py-16 md:px-10 md:py-20">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-3">01 / the problem</p>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                {t('landing.pain.lead1')}
                <br className="md:hidden" />
                {t('landing.pain.lead2')}
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm leading-relaxed text-ink-soft md:block">
              {t('landing.pain.lead')}
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[10px] border hairline bg-ink/10 md:grid-cols-3">
            {painPoints().map((p, i) => (
              <motion.div
                key={p.no}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="bg-card p-7"
              >
                <p className="font-mono text-xs text-clay">{p.no}</p>
                <h3 className="mt-4 font-heading text-xl font-bold">{p.title}</h3>
                <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-soft">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 流程 */}
      <section className="mx-auto max-w-almanac px-6 py-16 md:px-10 md:py-24">
        <p className="eyebrow mb-3">02 / how it works</p>
        <h2 className="mb-12 font-display text-3xl font-bold tracking-tight md:text-4xl">{t('landing.flow.title')}</h2>
        <div className="grid gap-10 md:grid-cols-3">
          {steps().map((s, i) => (
            <motion.div
              key={s.no}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative border-t hairline pt-6"
            >
              <p className="font-mono text-xs text-ochre-deep">{s.no}</p>
              <h3 className="mt-3 font-heading text-xl font-bold">{s.title}</h3>
              <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-soft">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 城市图集：画册式卡片 + 速览抽屉（编辑部风核心交互） */}
      <section className="border-y border-line bg-paper-deep/40">
        <div className="mx-auto max-w-almanac px-6 py-16 md:px-10 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">{t('landing.atlas.eyebrow')}</p>
              <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
                {t('landing.atlas.heading')}
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm leading-relaxed text-ink-soft md:block">
              {t('landing.atlas.sideNote')}
            </p>
          </div>

          {/* 大洲筛选 */}
          <div className="mb-7 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAtlasRegion('all')}
              className={`inline-flex min-h-[44px] items-center rounded-[5px] border px-4 py-2.5 font-data text-[11px] transition-colors ${
                atlasRegion === 'all'
                  ? 'border-pine bg-pine text-paper'
                  : 'border-line bg-card text-ink-soft hover:border-pine/50'
              }`}
            >
              {t('landing.atlas.all')} · {filteredCities.length}
            </button>
            {REGION_ORDER.map((r) => {
              const count = filteredCities.filter((c) => c.region === r).length;
              if (count === 0) return null;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAtlasRegion(r)}
                  className={`inline-flex min-h-[44px] items-center rounded-[5px] border px-4 py-2.5 font-data text-[11px] transition-colors ${
                    atlasRegion === r
                      ? 'border-pine bg-pine text-paper'
                      : 'border-line bg-card text-ink-soft hover:border-pine/50'
                  }`}
                >
                  {t(`region.${r}`)} · {count}
                </button>
              );
            })}
          </div>

          {/* 画册网格 */}
          {(() => {
            const shown = atlasRegion === 'all'
              ? filteredCities
              : filteredCities.filter((c) => c.region === atlasRegion);
            if (shown.length === 0) {
              // 空状态：不摆硬边界，改为「最接近」的 3 城 + 一键重置（人话提示）
              const closest = filteredCities.slice(0, 3);
              return (
                <div>
                  <div className="rounded-card border border-dashed border-line bg-card px-6 py-10 text-center">
                    <p className="font-display text-xl text-ink">{t('landing.atlas.closestTitle')}</p>
                    <p className="mt-2 text-sm text-ink-soft">
                      {closest.length > 0
                        ? t('landing.atlas.closestHint', { count: closest.length })
                        : t('landing.atlas.emptyHint')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilter(DEFAULT_FILTER)}
                      className="mt-5 inline-flex min-h-[44px] items-center rounded-full border border-pine px-5 py-2.5 font-data text-[11px] uppercase tracking-[0.14em] text-pine transition-colors hover:bg-pine hover:text-paper"
                    >
                      {t('landing.atlas.resetFilter')}
                    </button>
                  </div>
                  {closest.length > 0 && (
                    <div className="mt-6">
                      <p className="mb-3 font-data text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                        {t('landing.atlas.closestAction')}
                      </p>
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {closest.map((c, i) => (
                          <AtlasCard
                            key={c.id}
                            city={c}
                            index={i}
                            onOpen={setDrawerCity}
                            formatMoney={(usd) => formatMoney(usd)}
                            badge={t('landing.atlas.closestBadge')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shown.slice(0, 24).map((c, i) => (
                  <AtlasCard
                    key={c.id}
                    city={c}
                    index={i}
                    onOpen={setDrawerCity}
                    formatMoney={(usd) => formatMoney(usd)}
                  />
                ))}
              </div>
            );
          })()}

          <p className="mt-5 font-data text-[10px] text-ink-soft">
            {t('landing.atlas.footnote')}
          </p>
        </div>
      </section>

      {/* 速览抽屉（不跳页，右侧滑出） */}
      <CityDrawer city={drawerCity} onClose={() => setDrawerCity(null)} formatMoney={formatMoney} />

      {/* 结尾 CTA：统一入口（底边留白收敛，与全站 Footer 自然衔接） */}
      <section className="mx-auto max-w-almanac px-6 pb-14 pt-20 text-center md:px-10 md:pb-16 md:pt-28">
        <p className="eyebrow mb-5">04 / set sail</p>
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-snug tracking-tight md:text-[44px]">
          {t('landing.version.lead')}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.9] text-ink-soft">
          {t('landing.version.desc')}
        </p>

        <div className="mx-auto mt-12 grid max-w-3xl gap-5 text-left md:grid-cols-2">
          {/* 核心段：人人先答 */}
          <div className="flex flex-col rounded-xl border border-line bg-card p-6 md:p-7">
            <p className="eyebrow mb-2">core · free</p>
            <h3 className="font-heading text-xl font-bold text-ink">{t('landing.version.core')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {t('landing.version.coreDesc')}
            </p>
            <div className="mt-5 flex-1" />
            <p className="mb-4 font-data text-2xl font-semibold text-pine">{t('landing.version.litePrice')}</p>
            <button type="button" onClick={onStart} className="btn-clay w-full">
              {t('landing.version.coreCta')}
            </button>
          </div>

          {/* 深化段：核心段结束后可选 */}
          <div className="relative flex flex-col rounded-xl border-2 border-ochre bg-card p-6 md:p-7">
            <span className="absolute -top-2.5 right-5 rounded-full bg-ochre px-2.5 py-0.5 font-data text-[10px] font-medium tracking-[0.2em] text-paper">
              PRO
            </span>
            <p className="eyebrow mb-2">deepen · free</p>
            <h3 className="font-heading text-xl font-bold text-ink">{t('landing.version.deepen')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {t('landing.version.deepenDesc')}
            </p>
            <div className="mt-5 flex-1" />
            <p className="mb-4 font-data text-2xl font-semibold text-clay">
              {t('landing.version.proPrice')}
            </p>
            <button
              type="button"
              onClick={onStart}
              className="w-full rounded-lg border border-clay px-4 py-2.5 text-sm font-medium text-clay transition-colors hover:bg-clay/10"
            >
              {t('landing.version.deepenCta')}
            </button>
          </div>
        </div>

        <p className="mt-8 text-sm text-ink-soft">
          {t('landing.version.freeCta')}
        </p>
      </section>
    </div>
  );
}
