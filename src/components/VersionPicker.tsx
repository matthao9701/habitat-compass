import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../i18n';

interface VersionPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (version: 'lite' | 'pro') => void;
}

/**
 * 版本选择弹层（第十一轮入口收纳）：
 * 「开始测评」主入口统一弹出，简易免费 / 标准 PRO 两档并列，PRO 徽章保留。
 */
export default function VersionPicker({ open, onClose, onPick }: VersionPickerProps) {
  const { t } = useI18n();
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={t('landing.picker.title')}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg rounded-[16px] border border-ink/10 bg-card p-6 shadow-[0_18px_60px_rgba(8,47,73,0.22)] md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t('landing.picker.close')}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <p className="eyebrow mb-2">choose your edition</p>
            <h2 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
              {t('landing.picker.title')}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              {t('landing.picker.subtitle')}
            </p>

            <div className="mt-6 flex flex-col gap-3.5">
              {/* 简易版 · 永久免费 */}
              <button
                type="button"
                onClick={() => onPick('lite')}
                className="group flex items-center justify-between gap-4 rounded-[12px] border border-ink/12 bg-card p-4 text-left transition-all duration-200 hover:border-pine/60 hover:bg-pine/[0.04] md:p-5"
              >
                <span className="min-w-0">
                  <span className="mb-1 flex items-center gap-2">
                    <span className="font-heading text-[15px] font-bold text-ink">
                      {t('landing.version.lite')}
                    </span>
                    <span className="rounded-full bg-pine/10 px-2 py-0.5 font-data text-[9.5px] font-medium uppercase tracking-[0.14em] text-pine">
                      {t('landing.picker.freeBadge')}
                    </span>
                  </span>
                  <span className="block truncate text-[12px] leading-relaxed text-ink-soft">
                    {t('landing.version.liteDesc')}
                  </span>
                </span>
                <span className="shrink-0 font-heading text-[13px] font-medium text-pine transition-transform duration-200 group-hover:translate-x-0.5">
                  {t('landing.picker.liteCta')} →
                </span>
              </button>

              {/* 标准版 · PRO */}
              <button
                type="button"
                onClick={() => onPick('pro')}
                className="group flex items-center justify-between gap-4 rounded-[12px] border-2 border-ochre/80 bg-card p-4 text-left transition-all duration-200 hover:border-ochre hover:bg-ochre/[0.05] md:p-5"
              >
                <span className="min-w-0">
                  <span className="mb-1 flex items-center gap-2">
                    <span className="font-heading text-[15px] font-bold text-ink">
                      {t('landing.version.pro')}
                    </span>
                    <span className="rounded-full bg-ochre px-2 py-0.5 font-data text-[9.5px] font-medium tracking-[0.14em] text-paper">
                      PRO
                    </span>
                  </span>
                  <span className="block truncate text-[12px] leading-relaxed text-ink-soft">
                    {t('landing.version.proDesc')}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-data text-base font-semibold text-clay">¥29.9</span>
                  <span className="block font-heading text-[12px] font-medium text-clay">
                    {t('landing.picker.proCta')} →
                  </span>
                </span>
              </button>
            </div>

            <p className="mt-5 text-center font-mono text-[10px] text-ink-soft">
              {t('landing.picker.note')}
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
