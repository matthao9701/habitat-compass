import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createProOrder, PRO_PRICE_CNY, type PayChannel, type ProOrder } from '../../lib/storage';
import { track } from '../../lib/telemetry';
import { useI18n, translate, getCurrentLang } from '../../i18n';

/**
 * 模拟支付确认弹窗：渠道选择 → 2 秒虚拟处理动画 → 解锁成功。
 * 演示环境 · 虚拟计费，不产生真实扣款。
 */

/** 支付渠道清单（工厂：渲染期取当前语言） */
function channels(): { value: PayChannel; label: string; hint: string }[] {
  const L = (k: string): string => translate(getCurrentLang(), k);
  return [
    { value: 'alipay', label: L('bill.channel.alipay'), hint: L('bill.pay.scanning') },
    { value: 'wechat', label: L('bill.channel.wechat'), hint: L('bill.pay.checkout') },
    { value: 'card', label: L('bill.channel.card'), hint: L('bill.pay.quick') },
  ];
}

function ChannelGlyph({ channel }: { channel: PayChannel }) {
  const { t } = useI18n();
  if (channel === 'alipay') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path d="M7 13.5c3.5 1.5 7.5 1 10-1.5M9.5 8.5v6.5c0 1.4-1.2 2.2-2.4 2" strokeLinecap="round" />
      </svg>
    );
  }
  if (channel === 'wechat') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <ellipse cx="9.5" cy="9.5" rx="6.5" ry="5.5" />
        <path d="M14 11c3.2.4 6 2.4 6 4.9 0 1.3-.8 2.4-2 3.2l.7 2-2.4-1.2c-.8.2-1.5.3-2.3.3-3.3 0-6-2-6-4.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10.5h18M7 15h4" strokeLinecap="round" />
    </svg>
  );
}

interface PayModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (order: ProOrder) => void;
}

export default function PayModal({ open, onClose, onSuccess }: PayModalProps) {
  const { t } = useI18n();
  const [channel, setChannel] = useState<PayChannel>('alipay');
  const [phase, setPhase] = useState<'select' | 'processing' | 'done'>('select');
  const [order, setOrder] = useState<ProOrder | null>(null);

  // 打开时重置状态
  useEffect(() => {
    if (open) {
      setPhase('select');
      setOrder(null);
    }
  }, [open]);

  function confirmPay(): void {
    track('pay_click');
    setPhase('processing');
    // 虚拟处理：2 秒后成功（纯前端模拟，无真实交易）
    window.setTimeout(() => {
      const created = createProOrder(channel);
      setOrder(created);
      setPhase('done');
      track('unlock_success');
    }, 2000);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-[2px] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={phase === 'processing' ? undefined : onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-xl border border-line bg-card shadow-[0_18px_50px_rgba(31,45,40,0.18)]"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="eyebrow text-[10px]">checkout · demo</p>
                <h3 className="font-heading text-lg font-bold text-ink">{t('bill.pay.title')}</h3>
              </div>
              <span className="font-data text-xl font-semibold text-clay">
                ¥{PRO_PRICE_CNY.toFixed(1)}
              </span>
            </div>

            {phase === 'select' && (
              <div className="px-5 py-4">
                <p className="mb-3 text-sm text-ink-soft">{t('bill.pay.channel')}</p>
                <div className="mb-4 space-y-2">
                  {channels().map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setChannel(c.value)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                        channel === c.value
                          ? 'border-clay bg-clay/10 text-ink'
                          : 'border-line bg-paper text-ink hover:border-ochre/60'
                      }`}
                    >
                      <span className={channel === c.value ? 'text-clay' : 'text-ink-soft'}>
                        <ChannelGlyph channel={c.value} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{c.label}</span>
                        <span className="block text-xs text-ink-soft">{c.hint}</span>
                      </span>
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          channel === c.value ? 'border-clay bg-clay' : 'border-ink/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={confirmPay}
                  className="w-full rounded-lg bg-clay px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay-deep"
                >
                  {t('bill.pay.confirm', { price: PRO_PRICE_CNY.toFixed(1) })}
                </button>
                <p className="mt-3 text-center text-xs text-ink-soft">
                  {t('bill.demoNotice')}
                </p>
              </div>
            )}

            {phase === 'processing' && (
              <div className="flex flex-col items-center px-5 py-10">
                <motion.div
                  className="mb-4 h-10 w-10 rounded-full border-2 border-ochre/30 border-t-clay"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                />
                <p className="font-data text-sm text-ink-soft">{t('bill.pay.processing')}</p>
                <p className="mt-1 text-xs text-ink-soft">{t('bill.pay.demo')}</p>
              </div>
            )}

            {phase === 'done' && order && (
              <div className="px-5 py-6 text-center">
                <svg viewBox="0 0 24 24" className="mx-auto mb-3 h-12 w-12 text-moss" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="M7.5 12.5l3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h4 className="font-heading text-lg font-bold text-ink">{t('bill.pay.done')}</h4>
                <p className="mt-1 font-data text-xs text-ink-soft">
                  {t('bill.pay.orderLine', { id: order.id, amount: order.amountCny.toFixed(1) })}
                </p>
                <button
                  type="button"
                  onClick={() => onSuccess(order)}
                  className="mt-5 w-full rounded-lg bg-clay px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay-deep"
                >
                  {t('bill.pay.startPro')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
