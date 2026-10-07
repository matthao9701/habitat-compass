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
        // 亮色相仅用于「实心填充」（进度条/色点/图表块），白底上的文字不足以达到 WCAG AA 4.5:1，
        // 故仿 clay / clay-deep 的先例，为文字单独提供同色相加深版（对比度见注释，均 ≥4.5:1）。
        ochre: {
          DEFAULT: '#B98A2F',
          deep: '#8A5F0A', // 5.32:1 on paper
        },
        teal: {
          DEFAULT: '#3E7C8F',
          deep: '#336673', // 6.02:1 on paper
        },
        moss: {
          DEFAULT: '#5F7A5A',
          deep: '#51694B', // 5.70:1 on paper
        },
        sea: {
          DEFAULT: '#7FA8B8',
          deep: '#2F6A7D', // 5.69:1 on paper
        },
      },
      fontFamily: {
        // 第十五轮字体改版（全部 OFL 自托管可变字体，仅打包 latin 子集）：
        //   标题  Fraunces（soft serif，带光学尺寸，旅程探索感）
        //   点缀  Newsreader（衬线引用/副标）
        //   正文 / 数据  Manrope（几何人文黑体；数字为真等宽数字，替代原 JetBrains/IBM Plex Mono 的「代码感」等宽字体）
        // 中文走系统黑体栈（PingFang SC / 微软雅黑 / 思源黑体），不自托管 CJK 字体：
        // @fontsource/noto-sans-sc 会切出 101 个切片文件，移动端首屏代价过高。
        display: [
          '"Fraunces Variable"',
          'Georgia',
          '"Songti SC"',
          '"Noto Serif CJK SC"',
          'serif',
        ], // 大标题/城市名（旅程探索感）
        heading: [
          '"Fraunces Variable"',
          'Georgia',
          '"Songti SC"',
          '"Noto Serif CJK SC"',
          'serif',
        ], // 区块标题
        body: [
          '"Manrope Variable"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Noto Sans CJK SC"',
          'system-ui',
          'sans-serif',
        ], // 正文（font-normal，行高放宽）
        data: [
          '"Manrope Variable"',
          '-apple-system',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ], // 指标/数值（font-variant-numeric: tabular-nums 保证纵向对齐）
        'serif-accent': ['"Newsreader Variable"', 'Georgia', 'serif'], // 英文副标/引用衬线点缀
        // 兼容映射
        sans: [
          '"Manrope Variable"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Noto Sans CJK SC"',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"Fraunces Variable"', '"Newsreader Variable"', 'Georgia', 'serif'],
        // 旧 `font-mono` 类名保留但改指 Manrope：全站等宽小字（eyebrow 标签、脚注、数值）
        // 多为排版用途而非代码，改用几何黑体后观感更整洁。
        mono: [
          '"Manrope Variable"',
          '-apple-system',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'system-ui',
          'sans-serif',
        ],
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
