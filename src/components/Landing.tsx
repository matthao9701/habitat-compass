import { useState } from 'react';
import { motion } from 'framer-motion';
import CompassMark from './CompassMark';
import RouteChart from './RouteChart';
import { cities } from '../data';
import { DEMO_PROFILES } from '../data/demoProfiles';
import { REGION_LABEL, REGION_ORDER, subregionLabel } from '../data/regions';
import { formatCost } from '../lib/engine';
import { useI18n, translate, getCurrentLang } from '../i18n';
import { cityName, formatMoney } from '../lib/format';

interface LandingProps {
  onStart: (version?: 'lite' | 'pro') => void;
  onDemo: (profileId: string) => void;
  onProIntro: () => void;
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

export default function Landing({ onStart, onDemo, onProIntro }: LandingProps) {
  const { t } = useI18n();
  const marqueeList = [...cities, ...cities];
  const [atlasRegion, setAtlasRegion] = useState<string>('all');
  const atlasCities =
    atlasRegion === 'all' ? cities : cities.filter((c) => c.region === atlasRegion);
  const regionCount = (r: string) => cities.filter((c) => c.region === r).length;

  return (
    <div className="grain min-h-screen bg-paper text-ink">
      {/* 顶部导航 */}
      <header className="mx-auto flex max-w-almanac items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3 text-ink">
          <CompassMark size={32} />
          <div className="leading-tight">
            <p className="font-display text-[17px] font-bold tracking-wide">{t('landing.hero.title')}</p>
            <p className="font-mono text-[9px] uppercase tracking-eyebrow text-ink-soft">
              overseas almanac
            </p>
          </div>
        </div>
        <button type="button" onClick={() => onStart()} className="btn-clay !px-6 !py-2.5 text-sm">
          {t('nav.startQuiz')}
        </button>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-almanac px-6 pb-16 pt-8 md:px-10 md:pb-24 md:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
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
              className="font-display text-[40px] font-black leading-[1.18] tracking-tight md:text-[60px]"
            >
              {t('landing.hero.l1')}
              <br />
              {t('landing.hero.l2a')}<span className="text-clay">{t('landing.hero.lead')}</span>{t('landing.hero.l2b')}
              <br />
              {t('landing.hero.l3')}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-4 font-serif-accent text-[14px] lowercase tracking-[0.32em] text-ink-soft"
            >
              nomadmatch
            </motion.p>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-6 max-w-md text-[15.5px] leading-[1.9] text-ink-soft"
            >
              {t('landing.hero.desc1')}
              {t('landing.hero.desc2')}
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <button type="button" onClick={() => onStart()} className="btn-clay">
                {t('landing.hero.cta')}
                <span className="font-mono text-xs opacity-80">→</span>
              </button>
              <p className="font-mono text-[11px] text-ink-soft">
                {t('landing.hero.ctaHint')}
              </p>
            </motion.div>
          </div>

          {/* 海图卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[12px] border hairline bg-ink p-6 md:p-8"
          >
            <div className="mb-4 flex items-center justify-between text-paper">
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-paper/60">
                chart 100 · nomad routes
              </p>
              <CompassMark size={26} className="text-paper/70" />
            </div>
            <RouteChart cities={cities} compact className="text-paper/70 w-full" />
            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-[6px] border border-paper/15 text-center">
              {[
                ['200', t('landing.stat.cities')],
                ['6', t('landing.stat.continents')],
                ['0', t('landing.stat.threshold')],
              ].map(([v, l]) => (
                <div key={l} className="bg-paper/[0.04] px-2 py-3">
                  <p className="font-mono text-lg text-paper">{v}</p>
                  <p className="font-mono text-[9px] uppercase tracking-eyebrow text-paper/50">
                    {l}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
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
                <p className="font-heading text-lg font-bold text-ink">{profile.label}</p>
                <p className="mt-1.5 font-mono text-[11px] text-ochre">{profile.tagline}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{profile.desc}</p>
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
              <p className="font-mono text-xs text-ochre">{s.no}</p>
              <h3 className="mt-3 font-heading text-xl font-bold">{s.title}</h3>
              <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-soft">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 城市图集：按大洲浏览 */}
      <section className="border-y hairline bg-card/50">
        <div className="mx-auto max-w-almanac px-6 py-16 md:px-10 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">03 / the atlas</p>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{t('landing.atlas.title')}</h2>
            </div>
            <p className="hidden max-w-xs text-sm leading-relaxed text-ink-soft md:block">
              {t('landing.atlas.desc')}
            </p>
          </div>

          <div className="mb-7 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAtlasRegion('all')}
              className={`rounded-full border px-4 py-1.5 font-mono text-[11px] transition-colors ${
                atlasRegion === 'all'
                  ? 'border-clay bg-clay/10 text-clay'
                  : 'border-ink/15 bg-card text-ink-soft hover:border-clay/50'
              }`}
            >
              {t('landing.atlas.all')} · {cities.length}
            </button>
            {REGION_ORDER.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAtlasRegion(r)}
                className={`rounded-full border px-4 py-1.5 font-mono text-[11px] transition-colors ${
                  atlasRegion === r
                    ? 'border-clay bg-clay/10 text-clay'
                    : 'border-ink/15 bg-card text-ink-soft hover:border-clay/50'
                }`}
              >
                {REGION_LABEL[r]} · {regionCount(r)}
              </button>
            ))}
          </div>

          {atlasRegion === 'all' ? (
            <div className="grid gap-6 md:grid-cols-2">
              {REGION_ORDER.map((r) => {
                const pool = cities.filter((c) => c.region === r);
                return (
                  <div key={r} className="rounded-[10px] border hairline bg-card p-5">
                    <div className="mb-3 flex items-baseline justify-between">
                      <h3 className="font-heading text-base font-bold">{REGION_LABEL[r]}</h3>
                      <span className="font-mono text-[10px] text-ink-soft">{t('landing.atlas.count', { count: pool.length })}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pool.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAtlasRegion(r)}
                          className="rounded-[5px] border border-ink/10 bg-paper px-2 py-1 text-[11.5px] text-ink transition-colors hover:border-clay/60 hover:text-clay"
                        >
                          {cityName(c)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[10px] border hairline bg-card">
              {atlasCities.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-baseline justify-between gap-4 border-b hairline px-5 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span className="w-6 shrink-0 font-mono text-[10px] text-ink-soft/70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[13.5px] font-medium text-ink">{cityName(c)}</span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-soft">
                      {c.countryZh} · {subregionLabel(c.subregion)}
                    </span>
                  </div>
                  <div className="hidden shrink-0 items-baseline gap-4 sm:flex">
                    <span className="font-mono text-[10.5px] text-ink-soft">
                      {c.monthlyCostUSD != null ? t('landing.cost.perMonth', { cost: formatMoney(c.monthlyCostUSD) }) : t('landing.cost.na')}
                    </span>
                    <span className="max-w-[220px] truncate text-[11px] text-ink-soft">
                      {c.climateDetail?.summary ?? t('landing.cost.climateNA')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 font-mono text-[10px] text-ink-soft">
            {t('landing.atlas.footnote')}
          </p>
        </div>
      </section>

      {/* 深色城市带 */}
      <section className="overflow-hidden border-y hairline bg-ink py-10">
        <p className="mx-auto mb-7 max-w-almanac px-6 font-mono text-[10px] uppercase tracking-eyebrow text-paper/50 md:px-10">
          200 cities · 6 continents — from lisbon to nadi
        </p>
        <div className="relative flex w-max animate-marquee gap-10 whitespace-nowrap">
          {marqueeList.map((c, i) => (
            <div key={`${c.id}-${i}`} className="flex items-baseline gap-3 text-paper/80">
              <span className="font-medium text-lg">{cityName(c)}</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-paper/40">
                {c.nameEn} · {formatCost(c)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 结尾 CTA：版本选择 */}
      <section className="mx-auto max-w-almanac px-6 py-20 text-center md:px-10 md:py-28">
        <p className="eyebrow mb-5">04 / set sail</p>
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-snug tracking-tight md:text-[44px]">
          {t('landing.version.lead')}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.9] text-ink-soft">
          {t('landing.version.desc')}
        </p>

        <div className="mx-auto mt-12 grid max-w-3xl gap-5 text-left md:grid-cols-2">
          {/* 简易版卡片 */}
          <div className="flex flex-col rounded-xl border border-line bg-card p-6 md:p-7">
            <p className="eyebrow mb-2">lite edition · free</p>
            <h3 className="font-heading text-xl font-bold text-ink">{t('landing.version.lite')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {t('landing.version.liteDesc')}
            </p>
            <div className="mt-5 flex-1" />
            <p className="mb-4 font-data text-2xl font-semibold text-pine">{t('landing.version.litePrice')}</p>
            <button type="button" onClick={() => onStart()} className="btn-clay w-full">
              {t('landing.version.liteCta')}
            </button>
          </div>

          {/* 标准版卡片（PRO） */}
          <div className="relative flex flex-col rounded-xl border-2 border-ochre bg-card p-6 md:p-7">
            <span className="absolute -top-2.5 right-5 rounded-full bg-ochre px-2.5 py-0.5 font-data text-[10px] font-medium tracking-[0.2em] text-paper">
              PRO
            </span>
            <p className="eyebrow mb-2">standard edition · one-time</p>
            <h3 className="font-heading text-xl font-bold text-ink">{t('landing.version.pro')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {t('landing.version.proDesc')}
            </p>
            <div className="mt-5 flex-1" />
            <p className="mb-4 font-data text-2xl font-semibold text-clay">
              ¥29.9 <span className="text-xs font-normal text-ink-soft">{t('landing.version.proPrice')}</span>
            </p>
            <button
              type="button"
              onClick={onProIntro}
              className="w-full rounded-lg border border-clay px-4 py-2.5 text-sm font-medium text-clay transition-colors hover:bg-clay/10"
            >
              {t('landing.version.proCta')}
            </button>
          </div>
        </div>

        <button type="button" onClick={() => onStart()} className="mt-8 text-sm text-ink-soft underline-offset-4 transition-colors hover:text-clay hover:underline">
          {t('landing.version.freeCta')}
        </button>
      </section>

      <footer className="border-t hairline">
        <div className="mx-auto flex max-w-almanac flex-col gap-3 px-6 py-8 text-[11px] text-ink-soft md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-center gap-2">
            <CompassMark size={18} />
            <span className="font-mono uppercase tracking-eyebrow">{t('landing.footer.brand')}</span>
          </div>
          <div className="flex flex-col gap-1 md:items-end">
            <p>{t('landing.footer.disclaimer')}</p>
            <p className="font-light">
              {t('landing.footer.data')}
            </p>
            <p className="font-light">{t('landing.footer.fonts')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
