// 图表/数据可视化集中取色（天空蓝白体系，第十一轮换肤）
// UI 类名请使用 tailwind token（text-clay/bg-pine 等），只有 SVG 需要真实 hex 时才 import 这里。
export const CHART_COLORS = {
  deepSea: '#0369A1', // pine token：主操作深天蓝/序列 1
  coral: '#EE6C4D', // clay token：强调/序列 2
  sand: '#D9A441', // ochre token：评分/序列 3
  teal: '#17A2C6', // teal token：亮天蓝 accent/序列 4
  ink: '#082F49',
  inkSoft: '#4E7A96',
  paper: '#F0F9FF',
  sea: '#57B4E0',
  moss: '#2E8B74',
} as const;

/** 空气质量 WHO 分档 → 语义色 tailwind 类（第十轮；绿=优 蓝=良 金=一般 橙=差） */
export const AIR_BAND_TONE: Record<'good' | 'fair' | 'moderate' | 'poor', string> = {
  good: 'text-moss',
  fair: 'text-sea',
  moderate: 'text-ochre',
  poor: 'text-clay-deep',
} as const;
