import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CompassMark from './CompassMark';
import { useI18n } from '../i18n';
import { usePwaInstall } from '../lib/pwa';

/**
 * PwaInstallCard — PWA 安装引导（自动弹出，可关闭）
 *
 * - Chrome / Edge / Android：捕获 beforeinstallprompt 后弹出，点「添加到桌面」调起原生安装框。
 * - iOS Safari：无原生事件，改为展示「分享 → 添加到主屏幕」图文指引。
 * - 关闭后进入 30 天冷却；已安装或已处于独立窗口时完全不出现。
 * - enabled=false 时只隐藏而不卸载：beforeinstallprompt 每次加载只触发一次，
 *   卸载会丢掉事件监听，回到首页就再也弹不出来了。
 */
export default function PwaInstallCard({ enabled = true }: { enabled?: boolean }) {
  const { t } = useI18n();
  const { visible, isIosGuide, promptInstall, dismiss } = usePwaInstall();
  const [manualOpen, setManualOpen] = useState(false);

  return (
    <AnimatePresence>
      {visible && enabled && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label={isIosGuide ? t('pwa.ios.title') : t('pwa.title')}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 md:pb-6"
        >
          <div className="pointer-events-auto w-full max-w-md rounded-card border hairline bg-card p-5 shadow-[0_12px_40px_rgba(31,36,33,0.16)] backdrop-blur">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-pine">
                <CompassMark size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-[15px] font-semibold leading-snug text-ink">
                  {isIosGuide ? t('pwa.ios.title') : t('pwa.title')}
                </p>
                <p className="mt-1 text-[12.5px] leading-[1.7] text-ink-soft">
                  {isIosGuide ? t('pwa.ios.desc') : t('pwa.desc')}
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label={t('pwa.close')}
                className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {isIosGuide ? (
              <ol className="mt-4 space-y-1.5 rounded-[6px] border hairline bg-paper px-4 py-3 font-data text-[12px] leading-relaxed text-ink-soft">
                <li>{t('pwa.ios.step1')}</li>
                <li>{t('pwa.ios.step2')}</li>
                <li>{t('pwa.ios.step3')}</li>
              </ol>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={() => void promptInstall()}
                  className="btn-clay !px-5 !py-2.5 whitespace-nowrap text-[13.5px]"
                >
                  {t('pwa.install')}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="whitespace-nowrap font-mono text-[11px] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {t('pwa.later')}
                </button>
                <button
                  type="button"
                  onClick={() => setManualOpen((v) => !v)}
                  aria-expanded={manualOpen}
                  className="whitespace-nowrap font-mono text-[11px] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline sm:ml-auto"
                >
                  {t('pwa.manual')}
                </button>
              </div>
            )}

            {!isIosGuide && manualOpen && (
              <ol className="mt-3 space-y-1.5 rounded-[6px] border hairline bg-paper px-4 py-3 font-data text-[11.5px] leading-relaxed text-ink-soft">
                <li>{t('pwa.ios.step1')}</li>
                <li>{t('pwa.ios.step2')}</li>
                <li>{t('pwa.ios.step3')}</li>
              </ol>
            )}

            {isIosGuide && (
              <button
                type="button"
                onClick={dismiss}
                className="mt-3 font-mono text-[11px] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {t('pwa.later')}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
