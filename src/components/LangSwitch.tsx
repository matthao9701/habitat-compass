import { useI18n } from '../i18n';

/** 语言切换：几何文字按钮（中 / EN），激活态珊瑚描边；切换即写 localStorage 并更新 html lang */
export default function LangSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const options: { id: 'zh' | 'en'; label: string; aria: string }[] = [
    { id: 'zh', label: t('lang.zhShort'), aria: t('lang.toZh') },
    { id: 'en', label: 'EN', aria: t('lang.toEn') },
  ];
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-[9px] border border-ink/12 bg-card p-0.5"
      role="group"
      aria-label="Language"
    >
      {options.map((o) => {
        const active = lang === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            aria-label={o.aria}
            onClick={() => setLang(o.id)}
            className={`rounded-[7px] px-2 py-1 font-data text-[10.5px] font-medium tracking-wide transition-colors duration-200 ${
              active ? 'bg-clay/10 text-clay' : 'text-ink-soft hover:text-ink'
            } ${compact ? 'min-w-[30px]' : 'min-w-[34px]'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
