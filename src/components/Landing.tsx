import { useState } from 'react';
import { motion } from 'framer-motion';
import { AtlasCard, CityDrawer } from './atlas/AtlasCard';
import { hasPhoto } from './atlas/CityPhoto';
import HeroChart from './HeroChart';
import { cities } from '../data';
import { DEMO_PROFILES } from '../data/demoProfiles';
import { formatMoney } from '../lib/format';
import type { City } from '../data/types';
import { useI18n, translate, getCurrentLang } from '../i18n';

interface LandingProps {
  onStart: () => void;
  onDemo: (profileId: string) => void;
  /** 跳转到「城市库」Tab——首页只做精选展示，完整筛选与浏览归城市库 */
  onBrowse: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** 首页城市精选：仅展示有实景图的城市（无图城市只出现在城市库），最多 12 座 */
const SHOWCASE = cities.filter((c) => hasPhoto(c.id)).slice(0, 12);

function steps(): { no: string; title: string; desc: string }[] {
  const L = (k: string): string => translate(getCurrentLang(), k);
  return [
    { no: '01', title: L('landing.step1.title'), desc: L('landing.step1.desc') },
    { no: '02', title: L('landing.step2.title'), desc: L('landing.step2.desc') },
    { no: '03', title: L('landing.step3.title'), desc: L('landing.step3.desc') },
  ];
}

export default function Landing({ onStart, onDemo, onBrowse }: LandingProps) {
  const { t } = useI18n();
  const [drawerCity, setDrawerCity] = useState<City | null>(null);

  return (
    <div className="grain min-h-screen bg-paper text-ink">
      {/* Hero —— 编辑部风：大标题 + 留白 + 主行动点；桌面端右侧以海图罗盘花点亮留白（品牌与导航由全站 TabBar 承载） */}
      <section className="relative mx-auto max-w-almanac px-6 pb-10 pt-10 md:px-10 md:pb-14 md:pt-16">
        {/* 装饰层：仅 xl+ 显示（窄桌面下大标题会挤占右栏，故 1280px 以下不显示），纯几何 SVG，不占版式、不参与交互 */}
        <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 xl:block" aria-hidden="true">
          <HeroChart className="h-[420px] w-[420px] text-pine/25" />
        </div>
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
          {t('landing.hero.l2a')}<span className="text-clay">{t('landing.hero.lead')}</span>{t('landing.hero.l2b')}
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

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mt-8"
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
            <button type="button" onClick={onBrowse} className="btn-ghost flex-1 !text-[13px] sm:flex-none">
              {t('landing.hero.browseCta')}
            </button>
          </div>
        </motion.div>
      </section>

      {/* 刊头统计条：极简单行，等宽数字 */}
      <section className="border-y border-line">
        <div className="mx-auto grid max-w-almanac grid-cols-2 divide-x divide-line px-0 md:grid-cols-4">
          {[
            [String(cities.length), t('landing.stat.cities')],
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
              <h2 className="font-display text-2xl font-semibold leading-snug tracking-tight md:text-3xl">
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
                className="group rounded-[10px] border hairline bg-card p-5 text-left transition-all duration-300 hover:border-clay/55 hover:shadow-lift md:p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                    demo {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-xs text-clay opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {t('landing.demo.cta')}
                  </span>
                </div>
                <p className="font-heading text-lg font-semibold text-ink">{t(`demo.${profile.id}.label`)}</p>
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

      {/* 流程 */}
      <section className="mx-auto max-w-almanac px-6 py-16 md:px-10 md:py-20">
        <p className="eyebrow mb-3">01 / how it works</p>
        <h2 className="mb-12 font-display text-3xl font-semibold tracking-tight md:text-4xl">{t('landing.flow.title')}</h2>
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
              <h3 className="mt-3 font-heading text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-soft">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 城市精选：仅展示有实景图的城市；完整筛选与浏览在城市库 Tab */}
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

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWCASE.map((c, i) => (
              <AtlasCard
                key={c.id}
                city={c}
                index={i}
                onOpen={setDrawerCity}
                formatMoney={(usd) => formatMoney(usd)}
              />
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t hairline pt-6">
            <p className="font-data text-[10px] text-ink-soft">
              {t('landing.atlas.footnote')}
            </p>
            <button type="button" onClick={onBrowse} className="btn-ghost !text-[13px]">
              {t('landing.atlas.browseAll', { count: cities.length })}
              <span className="font-data text-xs opacity-70">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 速览抽屉（不跳页，右侧滑出） */}
      <CityDrawer city={drawerCity} onClose={() => setDrawerCity(null)} formatMoney={formatMoney} />

      {/* 结尾 CTA：统一入口（底边留白收敛，与全站 Footer 自然衔接） */}
      <section className="mx-auto max-w-almanac px-6 pb-14 pt-20 text-center md:px-10 md:pb-16 md:pt-28">
        <p className="eyebrow mb-5">02 / set sail</p>
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-snug tracking-tight md:text-[44px]">
          {t('landing.version.lead')}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.9] text-ink-soft">
          {t('landing.version.desc')}
        </p>

        {/* 单一入口卡：标准测验 →（可选）深度测验，一段流程讲清两个层级，只留一个行动点 */}
        <div className="mx-auto mt-12 max-w-xl rounded-xl border hairline bg-card p-6 text-left md:p-7">
          <ol className="space-y-5">
            <li className="flex gap-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay font-data text-[11px] font-semibold text-paper">
                1
              </span>
              <div>
                <p className="font-heading text-base font-semibold text-ink">
                  {t('landing.version.core')}
                  <span className="ml-2 font-data text-[10px] font-normal uppercase tracking-wide text-pine">
                    {t('landing.version.litePrice')}
                  </span>
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  {t('landing.version.coreDesc')}
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ochre font-data text-[11px] font-semibold text-ochre-deep">
                2
              </span>
              <div>
                <p className="font-heading text-base font-semibold text-ink">
                  {t('landing.version.deepen')}
                  <span className="ml-2 rounded-full bg-ochre px-2 py-0.5 font-data text-[9px] font-medium tracking-[0.16em] text-paper">
                    {t('landing.version.optional')}
                  </span>
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  {t('landing.version.deepenDesc')}
                </p>
              </div>
            </li>
          </ol>

          <button type="button" onClick={onStart} className="btn-clay mt-6 w-full">
            {t('landing.version.coreCta')}
            <span className="font-data text-xs opacity-80">→</span>
          </button>
          <p className="mt-3 text-center text-[12.5px] text-ink-soft">
            {t('landing.version.freeCta')}
          </p>
        </div>
      </section>
    </div>
  );
}
