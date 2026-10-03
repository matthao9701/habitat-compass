// 图表/数据可视化集中取色（海洋蓝白体系）
// UI 类名请使用 tailwind token（text-clay/bg-pine 等），只有 SVG 需要真实 hex 时才 import 这里。
export const CHART_COLORS = {
  deepSea: '#0A4D68', // pine token：深色区块/序列 1
  coral: '#E76F51', // clay token：强调/序列 2
  sand: '#D9A441', // ochre token：评分/序列 3
  teal: '#3FA7BF', // teal token：序列 4
  ink: '#0A2530',
  inkSoft: '#5A7A8A',
  paper: '#F0F7FA',
  sea: '#4A8DB7',
  moss: '#2E8B74',
} as const;
