/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 第十一轮「天空蓝白」换肤：token 名不变只换值（组件零 diff）
        paper: '#F0F9FF',
        'paper-deep': '#E0F2FE',
        card: '#FFFFFF',
        ink: {
          DEFAULT: '#082F49',
          soft: '#4E7A96',
        },
        pine: '#0369A1', // 主操作深天蓝（白字对比 ≥5:1）
        clay: {
          DEFAULT: '#EE6C4D',
          deep: '#D14E2F',
        },
        ochre: '#D9A441',
        teal: '#17A2C6', // 亮天蓝 accent
        moss: '#2E8B74',
        sea: '#57B4E0',
      },
      fontFamily: {
        // 字体层级 token：各组件按 token 引用，不散落硬编码
        display: ['"Noto Sans SC"', 'system-ui', 'sans-serif'], // 页面大标题/Hero（配 font-black/font-bold + tracking-tight）
        heading: ['"Noto Sans SC"', 'system-ui', 'sans-serif'], // 区块标题（font-bold）
        body: ['"Noto Sans SC"', 'system-ui', 'sans-serif'], // 正文（font-normal，行高放宽）
        data: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'], // 数字/数据（tabular 等宽）
        'serif-accent': ['"Source Serif 4"', 'Georgia', 'serif'], // 英文副标/引用衬线点缀
        // 兼容映射
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', '"Noto Sans SC"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        chart: '4px',
      },
      letterSpacing: {
        eyebrow: '0.22em',
      },
      maxWidth: {
        almanac: '1180px',
      },
      transitionTimingFunction: {
        chart: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'dash-drift': {
          to: { strokeDashoffset: '-24' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'dash-drift': 'dash-drift 1.6s linear infinite',
        'soft-pulse': 'soft-pulse 2.4s ease-in-out infinite',
        marquee: 'marquee 150s linear infinite',
      },
    },
  },
  plugins: [],
};
