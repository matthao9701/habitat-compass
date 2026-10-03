import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PayModal from './PayModal';
import CompassMark from '../CompassMark';
import { ipipQuestions, proLifestyleQuestions } from '../../data/questionsPro';
import { interestTagsPro } from '../../data/interestsPro';
import { PRO_PRICE_CNY, isProUnlocked, loadOrders, type ProOrder } from '../../lib/storage';
import { track } from '../../lib/telemetry';

/**
 * 标准版商品介绍页：题量/题型/报告增强对比 + 虚拟计费入口。
 * 未购买用户可完整预览本页，但「开始测评」需要先解锁（虚拟支付）。
 */

interface CompareRow {
  label: string;
  lite: string;
  pro: string;
}

const COMPARE_ROWS: CompareRow[] = [
  { label: '人格测评', lite: 'OEJTS 32 题 · 七级双极量表', pro: 'IPIP-NEO 120 题 · 五点量表（30 facets × 4）' },
  { label: '生活偏好', lite: '8 道情景选择题', pro: '20 道四题型混编（情景 / 二选一 / 权重滑杆 / 排序）' },
  { label: '兴趣标签', lite: '16 个一级标签', pro: '28 个一级标签 + 二级细化多选' },
  { label: '人格模型', lite: 'MBTI 四轴偏好', pro: 'Big Five 五域剖面 + 30 facets 明细 + 16 型映射' },
  { label: '报告增强', lite: '基础报告', pro: '五维雷达 + facets 条形 + 映射说明卡 + 两版结果对比' },
  { label: '价格', lite: '永久免费', pro: `¥${PRO_PRICE_CNY.toFixed(1)} 一次性买断` },
];

export default function ProIntro({
  onStartPro,
  onExit,
}: {
  onStartPro: () => void;
  onExit: () => void;
}) {
  const [payOpen, setPayOpen] = useState(false);
  const unlocked = useMemo(() => isProUnlocked(), []);
  const latestOrder = useMemo<ProOrder | null>(() => loadOrders()[0] ?? null, []);

  // 埋点：付费页曝光（每次挂载记一次）
  useEffect(() => {
    track('pro_intro_view');
  }, []);

  return (
    <div className="min-h-screen bg-paper pb-24">
      <div className="mx-auto max-w-3xl px-6 pt-10 md:px-10">
        <button
          type="button"
          onClick={onExit}
          className="mb-8 inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-clay"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          返回首页
        </button>

        {/* 页头 */}
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <CompassMark className="h-9 w-9 text-ochre" />
            <span className="rounded-full border border-ochre px-2.5 py-0.5 font-data text-[10px] font-medium tracking-[0.2em] text-ochre">
              PRO
            </span>
          </div>
          <p className="eyebrow mb-3">standard edition · 标准版</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-ink md:text-4xl">
            深度版定居测评
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
            以 IPIP-NEO 专业人格量表为核心的三段式深度测评：
            更多题目、更细的维度、更完整的报告剖面。一次解锁，永久使用。
          </p>
        </header>

        {/* 价格卡 + 解锁入口 */}
        <section className="mb-10 rounded-xl border border-line bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-2">one-time purchase</p>
              <div className="flex items-baseline gap-2">
                <span className="font-data text-4xl font-semibold text-clay">
                  ¥{PRO_PRICE_CNY.toFixed(1)}
                </span>
                <span className="text-sm text-ink-soft">一次性买断 · 永久有效</span>
              </div>
            </div>
            {unlocked ? (
              <div className="text-right">
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-moss bg-moss/10 px-3 py-1 text-xs font-medium text-moss">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  已解锁
                </span>
                {latestOrder && (
                  <p className="font-data text-[11px] text-ink-soft">订单 {latestOrder.id}</p>
                )}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => (unlocked ? onStartPro() : setPayOpen(true))}
              className="rounded-lg bg-clay px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay-deep"
            >
              {unlocked ? '开始标准版测评' : `解锁标准版 ¥${PRO_PRICE_CNY.toFixed(1)}`}
            </button>
          </div>
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
            演示环境 · 虚拟计费，不产生真实扣款。人格量表译自 IPIP 国际人格项目池（公有领域），
            引用：IPIP (Goldberg, 1999) / IPIP-NEO 120 (Johnson, 2014)。
          </p>
        </section>

        {/* 对比表 */}
        <section className="mb-12">
          <h2 className="mb-5 font-heading text-xl font-bold text-ink">简易版 / 标准版对比</h2>
          <div className="overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-5 py-3 font-medium text-ink-soft">维度</th>
                  <th className="px-5 py-3 font-medium text-ink-soft">简易版（免费）</th>
                  <th className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-ochre">
                      标准版
                      <span className="rounded border border-ochre px-1 font-data text-[9px] tracking-[0.15em]">
                        PRO
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">{row.label}</td>
                    <td className="px-5 py-3 text-ink-soft">{row.lite}</td>
                    <td className="px-5 py-3 text-ink">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 题型说明 */}
        <section className="mb-12 grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'IPIP-NEO 120 题',
              desc: `${ipipQuestions.length} 道五点量表自陈句，覆盖大五人格 30 个侧面，官方 +/− 计分键，输出五域百分位与 16 型映射。`,
            },
            {
              title: '20 道混编偏好题',
              desc: `情景选择、强迫二选一、100 点权重滑杆、四选一排序四种题型，映射到 8 个定居偏好维度。`,
            },
            {
              title: '28 个兴趣标签',
              desc: `一级多选 + 选中后二级细化（每类 3-5 子项），子项选中会强化该兴趣在匹配中的权重。`,
            },
            {
              title: '两版结果对比',
              desc: '若此前做过简易版，报告页自动并排对比两版的人格类型与兴趣差异。',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-line bg-card p-5">
              <h3 className="mb-2 font-heading text-base font-bold text-ink">{item.title}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{item.desc}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-line pt-5 text-center">
          <p className="font-data text-[11px] text-ink-soft">
            共 {ipipQuestions.length + proLifestyleQuestions.length + interestTagsPro.length}{' '}
            道题 · 预计 20-25 分钟 · 进度自动保存
          </p>
          <p className="mt-2 text-xs text-ink-soft">演示环境 · 虚拟计费，不产生真实扣款</p>
        </footer>
      </div>

      <PayModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onSuccess={() => {
          setPayOpen(false);
          onStartPro();
        }}
      />
    </div>
  );
}
