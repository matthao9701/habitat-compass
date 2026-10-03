import { useState } from 'react';
import { motion } from 'framer-motion';
import CompassMark from './CompassMark';
import RouteChart from './RouteChart';
import { cities } from '../data';
import { DEMO_PROFILES } from '../data/demoProfiles';
import { REGION_LABEL, REGION_ORDER, subregionLabel } from '../data/regions';
import { formatCost } from '../lib/engine';

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

const PAIN_POINTS = [
  {
    no: '01',
    title: '信息零散，无从比较',
    desc: '小红书一篇、Reddit 一帖、YouTube 一支视频，每个人讲的都是自己的切片。预算、签证、网速、治安——没有同一张表能把它们对齐。',
  },
  {
    no: '02',
    title: '别人的天堂，可能是你的消耗',
    desc: '巴厘岛适合喜欢热闹与灵感的人，东京则偏爱秩序与独处。城市没有绝对好坏，错配的人格与生活方式才是后悔的根源。',
  },
  {
    no: '03',
    title: '试错成本太高',
    desc: '一次搬家意味着机票、押金、签证和几个月的时间。靠运气选城市，代价远高于认真做一次 10 分钟的系统测评。',
  },
];

const STEPS = [
  {
    no: '01',
    title: '完成三维测评',
    desc: '约 12 分钟，56 道题：MBTI 七级量表（OEJTS 结构）、生活情景选择、兴趣标签多选。分三个阶段推进，可随时回退修改。',
  },
  {
    no: '02',
    title: '引擎加权计算',
    desc: '人格特质契合 30% + 生活偏好 48% + 兴趣重合 22%，对全球 100 座城市逐一打分，气候、安全与医疗等客观数据同步纳入。',
  },
  {
    no: '03',
    title: '获得专属报告',
    desc: '你的 16 型人格解读、用户画像标签，与最适合定居的 Top 5 城市卡片和多维对比。',
  },
];

export default function Landing({ onStart, onDemo, onProIntro }: LandingProps) {
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
            <p className="font-display text-[17px] font-bold tracking-wide">栖居罗盘</p>
            <p className="font-mono text-[9px] uppercase tracking-eyebrow text-ink-soft">
              overseas almanac
            </p>
          </div>
        </div>
        <button type="button" onClick={() => onStart()} className="btn-clay !px-6 !py-2.5 text-sm">
          开始测评
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
              Vol.01 · 2025 海外定居指南
            </motion.p>
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="font-display text-[40px] font-black leading-[1.18] tracking-tight md:text-[60px]"
            >
              在世界的版图上，
              <br />
              找到<span className="text-clay">真正适合</span>你
              <br />
              停靠的那座城。
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
              一份结合 MBTI 人格、生活偏好与兴趣图谱的综合测评，
              为数字游民、自由职业者与独立开发者，从全球 100
              座城市中计算出你的 Top 5 定居之选。
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <button type="button" onClick={() => onStart()} className="btn-clay">
                开始我的测评
                <span className="font-mono text-xs opacity-80">→</span>
              </button>
              <p className="font-mono text-[11px] text-ink-soft">
                约 12 分钟 · 56 题 · 无需注册
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
                ['100', '收录城市'],
                ['6', '大洲覆盖'],
                ['0', '注册门槛'],
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
                还没准备好答题？先看一份演示报告
              </h2>
            </div>
            <p className="font-mono text-[11px] text-ink-soft">
              预设档案 · 即刻生成 · 含完整分析模块
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
                    查看示例 →
                  </span>
                </div>
                <p className="font-heading text-lg font-bold text-ink">{profile.label}</p>
                <p className="mt-1.5 font-mono text-[11px] text-ochre">{profile.tagline}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{profile.desc}</p>
                <div className="mt-4 flex items-center justify-between border-t hairline pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                    预计 {profile.expectedType}
                  </span>
                  <span className="font-mono text-[10px] text-ink-soft">≈ 10 秒</span>
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
                选一座城市定居，
                <br className="md:hidden" />
                为什么这么难？
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm leading-relaxed text-ink-soft md:block">
              迁居的本质是一次信息密集的决策，而大多数人手里只有碎片。
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[10px] border hairline bg-ink/10 md:grid-cols-3">
            {PAIN_POINTS.map((p, i) => (
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
        <h2 className="mb-12 font-display text-3xl font-bold tracking-tight md:text-4xl">三步，得到你的定居坐标</h2>
        <div className="grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
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
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">城市图集</h2>
            </div>
            <p className="hidden max-w-xs text-sm leading-relaxed text-ink-soft md:block">
              100 座城市、六大洲的公开数据快照；想逐城对比权重与成本，请进「城市对比」页。
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
              全部 · {cities.length}
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
                      <span className="font-mono text-[10px] text-ink-soft">{pool.length} 城</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pool.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setAtlasRegion(r)}
                          className="rounded-[5px] border border-ink/10 bg-paper px-2 py-1 text-[11.5px] text-ink transition-colors hover:border-clay/60 hover:text-clay"
                        >
                          {c.nameZh}
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
                    <span className="text-[13.5px] font-medium text-ink">{c.nameZh}</span>
                    <span className="shrink-0 font-mono text-[10px] text-ink-soft">
                      {c.countryZh} · {subregionLabel(c.subregion)}
                    </span>
                  </div>
                  <div className="hidden shrink-0 items-baseline gap-4 sm:flex">
                    <span className="font-mono text-[10.5px] text-ink-soft">
                      {c.monthlyCostUSD != null ? `~$${c.monthlyCostUSD.toLocaleString('en-US')}/月` : '成本 —'}
                    </span>
                    <span className="max-w-[220px] truncate text-[11px] text-ink-soft">
                      {c.climateDetail?.summary ?? '气候 —'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 font-mono text-[10px] text-ink-soft">
            数据口径与来源见报告页脚注 · GeoNames / Open-Meteo / Numbeo / EF EPI
          </p>
        </div>
      </section>

      {/* 深色城市带 */}
      <section className="overflow-hidden border-y hairline bg-ink py-10">
        <p className="mx-auto mb-7 max-w-almanac px-6 font-mono text-[10px] uppercase tracking-eyebrow text-paper/50 md:px-10">
          100 cities · 6 continents — from lisbon to nadi
        </p>
        <div className="relative flex w-max animate-marquee gap-10 whitespace-nowrap">
          {marqueeList.map((c, i) => (
            <div key={`${c.id}-${i}`} className="flex items-baseline gap-3 text-paper/80">
              <span className="font-medium text-lg">{c.nameZh}</span>
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
          下一座城，不该靠运气决定。
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.9] text-ink-soft">
          两套题库共享同一份 100 城数据底座与匹配引擎——选择适合你的深度。
        </p>

        <div className="mx-auto mt-12 grid max-w-3xl gap-5 text-left md:grid-cols-2">
          {/* 简易版卡片 */}
          <div className="flex flex-col rounded-xl border border-line bg-card p-6 md:p-7">
            <p className="eyebrow mb-2">lite edition · free</p>
            <h3 className="font-heading text-xl font-bold text-ink">简易版测评</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              56 道题 · 约 8 分钟。OEJTS 32 题七级量表 + 8 道情景选择题 + 16 个兴趣标签，基础报告。
            </p>
            <div className="mt-5 flex-1" />
            <p className="mb-4 font-data text-2xl font-semibold text-pine">免费</p>
            <button type="button" onClick={() => onStart()} className="btn-clay w-full">
              开始简易版
            </button>
          </div>

          {/* 标准版卡片（PRO） */}
          <div className="relative flex flex-col rounded-xl border-2 border-ochre bg-card p-6 md:p-7">
            <span className="absolute -top-2.5 right-5 rounded-full bg-ochre px-2.5 py-0.5 font-data text-[10px] font-medium tracking-[0.2em] text-paper">
              PRO
            </span>
            <p className="eyebrow mb-2">standard edition · one-time</p>
            <h3 className="font-heading text-xl font-bold text-ink">标准版测评</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              168 道题 · 约 20-25 分钟。IPIP-NEO 120 题 Big Five 剖面 + 20 道混编偏好题 +
              28 个兴趣标签（二级细化），报告含五维雷达与两版对比。
            </p>
            <div className="mt-5 flex-1" />
            <p className="mb-4 font-data text-2xl font-semibold text-clay">
              ¥29.9 <span className="text-xs font-normal text-ink-soft">一次性买断</span>
            </p>
            <button
              type="button"
              onClick={onProIntro}
              className="w-full rounded-lg border border-clay px-4 py-2.5 text-sm font-medium text-clay transition-colors hover:bg-clay/10"
            >
              查看详情 / 解锁标准版
            </button>
          </div>
        </div>

        <button type="button" onClick={() => onStart()} className="mt-8 text-sm text-ink-soft underline-offset-4 transition-colors hover:text-clay hover:underline">
          或直接免费生成我的报告
        </button>
      </section>

      <footer className="border-t hairline">
        <div className="mx-auto flex max-w-almanac flex-col gap-3 px-6 py-8 text-[11px] text-ink-soft md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-center gap-2">
            <CompassMark size={18} />
            <span className="font-mono uppercase tracking-eyebrow">栖居罗盘 · 海外定居指南</span>
          </div>
          <div className="flex flex-col gap-1 md:items-end">
            <p>生活成本与签证政策为参考快照，请以官方最新信息为准</p>
            <p className="font-light">
              数据：GeoNames (CC BY 4.0) / Open-Meteo (CC BY 4.0) / Numbeo / EF EPI
            </p>
            <p className="font-light">字体：思源黑体 / IBM Plex Mono / Source Serif 4（OFL 开源许可）</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
