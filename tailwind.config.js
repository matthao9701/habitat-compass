/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#F3EEE2',
        'paper-deep': '#EAE2D0',
        card: '#FBF8EF',
        ink: {
          DEFAULT: '#1F2D28',
          soft: '#4A5950',
        },
        pine: '#335043',
        clay: {
          DEFAULT: '#BE5A38',
          deep: '#9E4528',
        },
        ochre: '#B08544',
        teal: '#466F66',
        moss: '#4E7A5A',
        sea: '#52708A',
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
