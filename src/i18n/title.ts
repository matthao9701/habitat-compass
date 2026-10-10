/** 每种语言的 SEO 标题（运行时随语言切换写入 document.title） */
export const TITLE_BY_LANG: Record<'zh' | 'en', string> = {
  zh: '栖居罗盘 | 数字游民城市与全球生活成本指数',
  en: 'Habitat Compass | Find Your Ideal Nomad City & Global Living Index',
};

/** index.html 静态 meta 的双语 description（构建期默认 zh，运行时标题随语言切换） */
export const DESCRIPTION_BY_LANG: Record<'zh' | 'en', string> = {
  zh: '面向数字游民、远程办公者与海外移居者的定居决策工具：免费标准测验（原创情景迫选 + 生活偏好 + 兴趣标签）与可选深度测验（Big Five 剖面 + RIASEC），Digital Nomad 城市匹配、Cost of Living 生活成本对比、Remote Work 网速与签证指南（Visa Guide）、29 国分级所得税测算，270 城六洲加权评分与硬约束过滤。',
  en: 'A decision tool for digital nomads, remote workers and overseas movers: a free standard test (original scenario items + lifestyle + interest tags) and an optional deep test (Big Five profile + RIASEC), digital nomad city matching, cost of living comparison, remote work internet speed and a visa guide — 270 cities across 6 continents, weighted scoring and hard-constraint filtering.',
};

/** SEO 关键词（强化 Digital Nomad / Cost of Living / Remote Work / Visa Guide） */
export const KEYWORDS = 'digital nomad, cost of living, remote work, visa guide, digital nomad visa, best cities for digital nomads, remote work cities, cost of living index, 数字游民, 生活成本, 远程办公, 签证指南';
