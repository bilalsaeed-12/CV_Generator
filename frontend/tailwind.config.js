/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Letterpress metal: ink body, brass fittings, verdigris patina, warm paper.
        ink: {
          DEFAULT: '#10141C',
          soft: '#171D28',
          raised: '#1E2634',
          line: '#2A3345',
        },
        paper: {
          DEFAULT: '#FBFAF7',
          sunk: '#F3F1EC',
          line: '#E3DFD6',
        },
        graphite: {
          DEFAULT: '#4A5468',
          soft: '#6B7688',
          faint: '#9AA3B2',
        },
        brass: {
          DEFAULT: '#E8A33D',
          deep: '#C9821F',
          wash: '#FBF0DC',
        },
        verdigris: {
          DEFAULT: '#2E9E8F',
          deep: '#217A6E',
          wash: '#E1F2EF',
        },
        rust: '#C4562F',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Public Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        doc: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        display: ['clamp(2.6rem, 6.5vw, 5.4rem)', { lineHeight: '0.94', letterSpacing: '-0.035em' }],
        title: ['clamp(1.9rem, 3.6vw, 3rem)', { lineHeight: '1.04', letterSpacing: '-0.025em' }],
      },
      boxShadow: {
        page: '0 1px 2px rgba(16,20,28,.07), 0 12px 32px -12px rgba(16,20,28,.22)',
        lift: '0 1px 2px rgba(16,20,28,.06), 0 18px 40px -20px rgba(16,20,28,.35)',
        pop: '0 24px 60px -24px rgba(16,20,28,.45)',
        inset: 'inset 0 1px 0 rgba(255,255,255,.06)',
      },
      transitionTimingFunction: {
        press: 'cubic-bezier(.2,.8,.3,1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.96)' },
          to: { opacity: '1', transform: 'none' },
        },
        sweep: {
          '0%': { backgroundPosition: '-140% 0' },
          '100%': { backgroundPosition: '240% 0' },
        },
        'caret-blink': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        'rule-draw': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(.98)' },
          to: { opacity: '1', transform: 'none' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'fade-up': 'fade-up .6s cubic-bezier(.2,.8,.3,1) both',
        'fade-in': 'fade-in .5s ease both',
        'slide-in-right': 'slide-in-right .32s cubic-bezier(.2,.8,.3,1) both',
        'slide-in-left': 'slide-in-left .32s cubic-bezier(.2,.8,.3,1) both',
        'scale-in': 'scale-in .24s cubic-bezier(.2,.8,.3,1) both',
        sweep: 'sweep 1.5s linear infinite',
        'caret-blink': 'caret-blink 1.05s step-end infinite',
        'rule-draw': 'rule-draw .8s cubic-bezier(.2,.8,.3,1) both',
        'toast-in': 'toast-in .26s cubic-bezier(.2,.8,.3,1) both',
        spin: 'spin .7s linear infinite',
      },
    },
  },
  plugins: [],
}
