import { motion } from 'framer-motion';
import CompassMark from './CompassMark';
import RouteChart from './RouteChart';
import { cities } from '../data';
import { formatCost } from '../lib/engine';

interface LandingProps {
  onStart: () => void;
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
    desc: '人格特质契合 30% + 生活偏好 48% + 兴趣重合 22%，对 39 座城市逐一打分。',
  },
  {
    no: '03',
    title: '获得专属报告',
    desc: '你的 16 型人格解读、用户画像标签，与最适合定居的 Top 5 城市卡片和多维对比。',
  },
];

export default function Landing({ onStart }: LandingProps) {
  const marqueeList = [...cities, ...cities];

  return (
    <div className="grain min-h-screen bg-paper text-ink">
      {/* 顶部导航 */}
      <header className="mx-auto flex max-w-almanac items-center justify-between px-6 py-6 md:px-10">
        <div className="flex items-center gap-3 text-ink">
          <CompassMark size={32} />
          <div className="leading-tight">
            <p className="font-serif text-[17px] font-semibold tracking-wide">NomadMatch</p>
            <p className="font-mono text-[9px] uppercase tracking-eyebrow text-ink-soft">
              overseas almanac
            </p>
          </div>
        </div>
        <button type="button" onClick={onStart} className="btn-clay !px-6 !py-2.5 text-sm">
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
              className="font-serif text-[40px] font-medium leading-[1.18] tracking-tight md:text-[60px]"
            >
              在世界的版图上，
              <br />
              找到<span className="italic text-clay">真正适合</span>你
              <br />
              停靠的那座城。
            </motion.h1>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-7 max-w-md text-[15.5px] leading-[1.9] text-ink-soft"
            >
              一份结合 MBTI 人格、生活偏好与兴趣图谱的综合测评，
              为数字游民、自由职业者与独立开发者，从全球 39
              座热门城市中计算出你的 Top 5 定居之选。
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <button type="button" onClick={onStart} className="btn-clay">
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
                chart 39 · nomad routes
              </p>
              <CompassMark size={26} className="text-paper/70" />
            </div>
            <RouteChart cities={cities} compact className="text-paper/70 w-full" />
            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-[6px] border border-paper/15 text-center">
              {[
                ['39', '收录城市'],
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

      {/* 痛点 */}
      <section className="border-y hairline bg-paper-deep/60">
        <div className="mx-auto max-w-almanac px-6 py-16 md:px-10 md:py-20">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-3">01 / the problem</p>
              <h2 className="font-serif text-3xl font-medium md:text-4xl">
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
                <h3 className="mt-4 font-serif text-xl font-semibold">{p.title}</h3>
                <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-soft">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 流程 */}
      <section className="mx-auto max-w-almanac px-6 py-16 md:px-10 md:py-24">
        <p className="eyebrow mb-3">02 / how it works</p>
        <h2 className="mb-12 font-serif text-3xl font-medium md:text-4xl">三步，得到你的定居坐标</h2>
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
              <h3 className="mt-3 font-serif text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-[13.5px] leading-[1.85] text-ink-soft">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 深色城市带 */}
      <section className="overflow-hidden border-y hairline bg-ink py-10">
        <p className="mx-auto mb-7 max-w-almanac px-6 font-mono text-[10px] uppercase tracking-eyebrow text-paper/50 md:px-10">
          39 cities · europe — asia — americas — africa
        </p>
        <div className="relative flex w-max animate-marquee gap-10 whitespace-nowrap">
          {marqueeList.map((c, i) => (
            <div key={`${c.id}-${i}`} className="flex items-baseline gap-3 text-paper/80">
              <span className="font-serif text-lg">{c.nameZh}</span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-paper/40">
                {c.nameEn} · {formatCost(c)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 结尾 CTA */}
      <section className="mx-auto max-w-almanac px-6 py-20 text-center md:px-10 md:py-28">
        <p className="eyebrow mb-5">03 / set sail</p>
        <h2 className="mx-auto max-w-2xl font-serif text-3xl font-medium leading-snug md:text-[44px]">
          下一座城，不该靠运气决定。
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.9] text-ink-soft">
          完成测评，让人格、预算与兴趣替你把 39 座城市排好序。
        </p>
        <button type="button" onClick={onStart} className="btn-clay mt-9">
          免费生成我的报告
        </button>
      </section>

      <footer className="border-t hairline">
        <div className="mx-auto flex max-w-almanac flex-col gap-3 px-6 py-8 text-[11px] text-ink-soft md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-center gap-2">
            <CompassMark size={18} />
            <span className="font-mono uppercase tracking-eyebrow">NomadMatch · 海外定居指南</span>
          </div>
          <p>生活成本与签证政策为参考快照，请以官方最新信息为准</p>
        </div>
      </footer>
    </div>
  );
}
