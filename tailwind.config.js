/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 编辑部风改版：燕麦羊皮纸底 + 炭墨 + 深海航海蓝 / 暖赤陶
        paper: '#F9F8F6',
        'paper-deep': '#F1EFEA',
        card: '#FFFFFF',
        ink: {
          DEFAULT: '#1F2421',
          soft: '#6B6F6C',
        },
        pine: '#1D3557', // 主操作 · 深海航海蓝（白字对比 ≥10:1）
        clay: {
          DEFAULT: '#C96A52', // 暖赤陶强调
          deep: '#A94F38',
        },
        line: '#E5E7EB', // 极细浅线边框
        ochre: '#B98A2F',
        teal: '#3E7C8F',
        moss: '#5F7A5A',
        sea: '#7FA8B8',
      },
      fontFamily: {
        // 编辑部风：衬线大标题（Playfair Display，CJK 回退到系统衬线）+ JetBrains Mono 数据
        // 性能：西文用自托管 latin 子集，中文一律走系统字体（PingFang SC / 思源黑体 …），
        // 避免打包数百个 CJK 切片字体文件拖慢移动端首屏。
        display: [
          '"Playfair Display"',
          '"Source Serif 4"',
          'Georgia',
          '"Songti SC"',
          '"Noto Serif CJK SC"',
          'serif',
        ], // 大标题/城市名（旅程探索感）
        heading: [
          '"Playfair Display"',
          '"Source Serif 4"',
          'Georgia',
          '"Songti SC"',
          '"Noto Serif CJK SC"',
          'serif',
        ], // 区块标题
        body: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Noto Sans CJK SC"',
          'system-ui',
          'sans-serif',
        ], // 正文（font-normal，行高放宽）
        data: ['"JetBrains Mono Variable"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'], // 指标/坐标（等宽）
        'serif-accent': ['"Source Serif 4"', 'Georgia', 'serif'], // 英文副标/引用衬线点缀
        // 兼容映射
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Noto Sans CJK SC"',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"Playfair Display"', '"Source Serif 4"', '"Noto Sans SC"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono Variable"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        chart: '4px',
        card: '8px',
        drawer: '6px',
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
