// i18n 运行时：zh/en 双语，轻量 t() + React Context
// - 词典按域拆分在 ./dict 目录，此处只负责组装与查找
// - t(key, vars) 支持模板插值 {name}；en 缺失时回退 zh
// - 语言判定：localStorage（手动切换）> navigator.language（en* → en）> zh
// - lib 层（analysis.ts 等非组件环境）直接 import { translate } 使用

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DICTS, REVERSE_ZH } from './dict';
import { TITLE_BY_LANG, DESCRIPTION_BY_LANG } from './title';

export type Lang = 'zh' | 'en';

const LANG_KEY = 'nomadmatch.v1:lang';

function readStoredLang(): Lang | null {
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    return v === 'en' || v === 'zh' ? v : null;
  } catch {
    return null;
  }
}

function detectLang(): Lang {
  const stored = readStoredLang();
  if (stored) return stored;
  if (typeof navigator !== 'undefined' && /^en\b/i.test(navigator.language)) return 'en';
  return 'zh';
}

function persistLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // node / 隐私模式下降级为内存态
  }
}

/** 模板插值：'{name} 的报告' + {name:'Tokyo'} */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let raw: string;
  if (DICTS[lang][key] != null) {
    raw = DICTS[lang][key];
  } else if (DICTS.zh[key] != null) {
    raw = DICTS.zh[key];
  } else if (REVERSE_ZH[key] != null) {
    // 传入的是中文文案本身（规则层产出），反查对应键后按语言输出
    raw = DICTS[lang][REVERSE_ZH[key]] ?? key;
  } else {
    raw = key;
  }
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m: string, name: string) =>
    vars[name] != null ? String(vars[name]) : m,
  );
}

// ---------------------------------------------------------------------------
// 模块级当前语言：让组件外的 t()（常量工厂/回调/渲染期调用）与组件内 useI18n().t
// 共享同一实时状态；由 Provider 初始化与 setLang 时同步。
// ---------------------------------------------------------------------------
let currentLang: Lang = 'zh';

/** 取当前语言（模块级，供常量工厂/非组件环境使用） */
export function getCurrentLang(): Lang {
  return currentLang;
}

/** 模块级 t：任何环境可用，语言切换即时生效（render 期调用即响应式） */
export function t(key: string, vars?: Record<string, string | number>): string {
  return translate(currentLang, key, vars);
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = detectLang();
    currentLang = initial;
    return initial;
  });

  const setLang = useCallback((next: Lang) => {
    currentLang = next;
    setLangState(next);
    persistLang(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = TITLE_BY_LANG[lang];
    // SEO：title/description 双语随语言切换（index.html 静态默认 zh，运行时同步）
    const desc = DESCRIPTION_BY_LANG[lang];
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', TITLE_BY_LANG[lang]);
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** 非 React 环境（lib 规则层）取当前语言包文案 */
export function makeStaticT(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>): string => translate(lang, key, vars);
}
