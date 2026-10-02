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
      },
      fontFamily: {
        serif: ['"Fraunces"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Manrope"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
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
        marquee: 'marquee 60s linear infinite',
      },
    },
  },
  plugins: [],
};
