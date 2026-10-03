import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PayModal from './PayModal';
import CompassMark from '../CompassMark';
import { ipipQuestions, proLifestyleQuestions } from '../../data/questionsPro';
import { interestTagsPro } from '../../data/interestsPro';
import { PRO_PRICE_CNY, isProUnlocked, loadOrders, type ProOrder } from '../../lib/storage';
import { track } from '../../lib/telemetry';
import { useI18n, translate, getCurrentLang } from '../../i18n';

/**
 * 标准版商品介绍页：题量/题型/报告增强对比 + 虚拟计费入口。
 * 未购买用户可完整预览本页，但「开始测评」需要先解锁（虚拟支付）。
 */

interface CompareRow {
  label: string;
  lite: string;
  pro: string;
}

/** 版本对比表行（工厂：渲染期取当前语言） */
function compareRows(): CompareRow[] {
  const { t } = useI18n();
  const L = (k: string): string => translate(getCurrentLang(), k);
  return [
    { label: L('bill.table.personality'), lite: L('bill.table.personality.lite'), pro: L('bill.table.personality.pro') },
    { label: L('quiz.transition.ls'), lite: L('bill.table.lifestyle.lite'), pro: L('bill.table.lifestyle.pro') },
    { label: L('bill.table.interests'), lite: L('bill.table.interests.lite'), pro: L('bill.table.interests.pro') },
    { label: L('bill.table.model'), lite: L('bill.table.model.lite'), pro: L('bill.table.model.pro') },
    { label: L('bill.table.report'), lite: L('bill.table.report.lite'), pro: L('bill.table.report.pro') },
    { label: L('bill.table.price'), lite: L('bill.table.price.lite'), pro: t('bill.table.price.pro', { price: PRO_PRICE_CNY.toFixed(1) }) },
  ];
}

export default function ProIntro({
  onStartPro,
  onExit,
}: {
  onStartPro: () => void;
  onExit: () => void;
}) {
  const { t } = useI18n();
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
          {t('common.backHome')}
        </button>

        {/* 页头 */}
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <CompassMark className="h-9 w-9 text-ochre" />
            <span className="rounded-full border border-ochre px-2.5 py-0.5 font-data text-[10px] font-medium tracking-[0.2em] text-ochre">
              PRO
            </span>
          </div>
          <p className="eyebrow mb-3">{t('bill.pro.badge')}</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-ink md:text-4xl">
            {t('bill.pro.eyebrow')}
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
            {t('bill.pro.desc')}
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
                <span className="text-sm text-ink-soft">{t('bill.pro.priceNote')}</span>
              </div>
            </div>
            {unlocked ? (
              <div className="text-right">
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-moss bg-moss/10 px-3 py-1 text-xs font-medium text-moss">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t('profile.unlocked')}
                </span>
                {latestOrder && (
                  <p className="font-data text-[11px] text-ink-soft">{t('bill.order.label')} {latestOrder.id}</p>
                )}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => (unlocked ? onStartPro() : setPayOpen(true))}
              className="rounded-lg bg-clay px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay-deep"
            >
              {unlocked ? t('bill.pro.cta.start') : t('bill.pro.cta.unlock', { price: PRO_PRICE_CNY.toFixed(1) })}
            </button>
          </div>
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
            {t('bill.pro.ipipNote')}
          </p>
        </section>

        {/* 对比表 */}
        <section className="mb-12">
          <h2 className="mb-5 font-heading text-xl font-bold text-ink">{t('bill.pro.section.compare')}</h2>
          <div className="overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-5 py-3 font-medium text-ink-soft">{t('bill.pro.section.compareCol.dim')}</th>
                  <th className="px-5 py-3 font-medium text-ink-soft">{t('bill.pro.section.compareCol.lite')}</th>
                  <th className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-ochre">
                      {t('bill.pro.name')}
                      <span className="rounded border border-ochre px-1 font-data text-[9px] tracking-[0.15em]">
                        PRO
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {compareRows().map((row) => (
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
              title: t('bill.pro.section.quiz'),
              desc: t('bill.quiz.q1', { count: ipipQuestions.length }),
            },
            {
              title: t('bill.pro.section.mixed'),
              desc: t('bill.quiz.q2'),
            },
            {
              title: t('bill.pro.section.interests'),
              desc: t('bill.quiz.q3'),
            },
            {
              title: t('bill.pro.section.diff'),
              desc: t('bill.pro.section.diff.desc'),
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
            {t('bill.quiz.total', { count: ipipQuestions.length + proLifestyleQuestions.length + interestTagsPro.length })}
          </p>
          <p className="mt-2 text-xs text-ink-soft">{t('bill.pro.demoNote')}</p>
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
