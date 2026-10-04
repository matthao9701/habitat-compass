// ABOUTME: 第十三轮——全站页脚：用户协议 / 隐私政策链接（静态法律页，zh/en 各自对应路径）
import { useI18n } from '../i18n';

export default function Footer() {
  const { t, lang } = useI18n();
  const base = lang === 'en' ? '/en' : '';
  return (
    <footer className="mt-12 border-t border-paper-deep bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-xs text-ink-soft">
        <span className="font-semibold">© 栖居罗盘 Habitat Compass</span>
        <a className="text-pine hover:underline" href={`${base}/terms/`}>{t('footer.terms')}</a>
        <a className="text-pine hover:underline" href={`${base}/privacy/`}>{t('footer.privacy')}</a>
        <a className="text-pine hover:underline" href={`${base}/disclaimer/`}>{t('footer.disclaimer')}</a>
        <span className="ml-auto hidden sm:inline">{lang === 'en' ? 'Decision-support tool · not legal advice' : '决策辅助工具 · 不构成法律建议'}</span>
      </div>
    </footer>
  );
}
