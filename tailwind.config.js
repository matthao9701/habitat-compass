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
          // 深炭灰：一级正文/核心描述（在 #F9F8F6 上对比度 ≈12:1，消除暖底发灰）
          DEFAULT: '#272B33',
          // 中深灰：次级辅助说明、小标签、法律条款链接（≈7:1，手机强光下仍清晰）
          soft: '#525866',
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
        // 现代无衬线工具风（SIL OFL 开源可变字体，构建期自托管、仅按需加载 unicode 切片）：
        //   Noto Sans SC Variable —— 中英统一主字体（现代黑体，笔画均匀不发虚）
        // 系统黑体栈作为兜底；原先的衬线标题字体与西文备用字体已按「现代工具质感」诉求移除。
        display: [
          '"Noto Sans SC Variable"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ], // 大标题/城市名
        heading: [
          '"Noto Sans SC Variable"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ], // 区块标题
        body: [
          '"Noto Sans SC Variable"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ], // 正文
        data: [
          '"Noto Sans SC Variable"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ], // 指标/数值（font-variant-numeric: tabular-nums）
        // 兼容映射
        sans: [
          '"Noto Sans SC Variable"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        serif: ['"Noto Sans SC Variable"', '-apple-system', 'Georgia', 'serif'],
        // 旧 `font-mono` 类名保留但改指无衬线：全站等宽小字（eyebrow 标签、脚注、数值）
        // 多为排版用途而非代码，改用黑体后观感更整洁。
        mono: [
          '"Noto Sans SC Variable"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"PingFang SC"',
          '"Microsoft YaHei"',
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
      // 投影语义档（编辑部风：一律冷墨投影，从不发亮/发光）。
      // 收敛原先散落各处的 shadow-[...] 临时值，统一浮层层次：
      //   pin  < lift < toast < overlay  —— 卡片内小标签 → 卡片悬停 → 提示条 → 弹层/抽屉
      //   clay / clay-strong —— 测评选项选中态的暖赤陶微光
      //   glow-pine / glow-clay —— 悬浮操作钮（Ko-fi）静态与悬停
      boxShadow: {
        pin: '0 1px 3px rgba(31, 36, 33, 0.20)', // 图片上小胶囊/角标
        lift: '0 6px 24px rgba(31, 45, 40, 0.10)', // 卡片悬停上浮
        toast: '0 4px 18px rgba(31, 45, 40, 0.18)', // 底部提示条
        overlay: '0 12px 40px rgba(31, 36, 33, 0.16)', // 弹层
        'overlay-left': '-12px 0 40px rgba(31, 36, 33, 0.10)', // 右侧抽屉（向左投）
        clay: '0 2px 12px rgba(190, 90, 56, 0.18)', // 选项选中（浅）
        'clay-strong': '0 2px 10px rgba(190, 90, 56, 0.35)', // 选项选中（实底）
        'glow-pine': '0 6px 20px -6px rgba(29, 53, 87, 0.55)',
        'glow-clay': '0 10px 26px -8px rgba(201, 106, 82, 0.60)',
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
