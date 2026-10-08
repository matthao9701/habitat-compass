// 图表/数据可视化集中取色（编辑部风色板：燕麦羊皮纸底 + 炭墨 + 深海航海蓝 / 暖赤陶）
// UI 类名请使用 tailwind token（text-clay/bg-pine 等），只有 SVG 需要真实 hex 时才 import 这里。
// 各项与 tailwind.config.js token 一一对应，改色时两处需同步（verify-iter-v8 会校验）。
export const CHART_COLORS = {
  deepSea: '#1D3557', // pine token：主操作深海航海蓝/序列 1
  coral: '#C96A52', // clay token：暖赤陶强调/序列 2
  sand: '#B98A2F', // ochre token：黄铜评分/序列 3
  teal: '#3E7C8F', // teal token：海图青/序列 4
  ink: '#1F2421',
  inkSoft: '#6B6F6C',
  paper: '#F9F8F6',
  sea: '#7FA8B8',
  moss: '#5F7A5A',
} as const;

/** 空气质量 WHO 分档 → 语义色 tailwind 类（第十轮；绿=优 蓝=良 金=一般 橙=差） */
export const AIR_BAND_TONE: Record<'good' | 'fair' | 'moderate' | 'poor', string> = {
  good: 'text-moss-deep',
  fair: 'text-sea-deep',
  moderate: 'text-ochre-deep',
  poor: 'text-clay-deep',
} as const;
