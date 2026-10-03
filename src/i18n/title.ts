/** 每种语言的 SEO 标题（运行时随语言切换写入 document.title） */
export const TITLE_BY_LANG: Record<'zh' | 'en', string> = {
  zh: '栖居罗盘 · 海外定居指南',
  en: 'Compass Living · Overseas Settlement Guide',
};

/** index.html 静态 meta 的双语 description（构建期默认 zh，运行时标题随语言切换） */
export const DESCRIPTION_BY_LANG: Record<'zh' | 'en', string> = {
  zh: '面向数字游民与自由职业者的海外城市定居决策工具：性格与偏好测评、200 城六洲加权匹配、成本与安全对比、硬约束过滤与国家参考数据。',
  en: 'A settlement decision tool for digital nomads and freelancers: personality & preference quiz, weighted matching across 200 cities on 6 continents, cost & safety comparison, hard-constraint filtering and country-level reference data.',
};
