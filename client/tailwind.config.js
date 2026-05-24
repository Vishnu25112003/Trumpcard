/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a2e',
          600: '#16213e',
        },
        accent: {
          purple: '#7c3aed',
          gold:   '#f59e0b',
          red:    '#ef4444',
        },
      },
      animation: {
        'deal-in':      'deal-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'slide-up':     'slide-up 0.3s ease-out forwards',
        'slide-down':   'slide-down 0.3s ease-out forwards',
        'fade-in':      'fade-in 0.25s ease-out forwards',
        'turn-banner':  'turn-banner 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float':        'float 3.5s ease-in-out infinite',
        'float-slow':   'float 5s ease-in-out infinite',
        'glow-pulse':   'glow-pulse 2s ease-in-out infinite',
        'stat-pop':     'stat-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'result-in':    'result-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'player-join':  'player-join 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'shake':        'shake 0.4s ease-in-out',
        'confetti':     'confetti 1.5s ease-in forwards',
        'pop-in':       'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'timer-pulse':  'timer-pulse 1s ease-in-out infinite',
      },
      keyframes: {
        'deal-in': {
          '0%':   { opacity: '0', transform: 'translateY(-40px) scale(0.85) rotate(-4deg)' },
          '65%':  { transform: 'translateY(6px) scale(1.03) rotate(1deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1) rotate(0deg)' },
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(16px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          'from': { opacity: '0', transform: 'translateY(-16px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
        'turn-banner': {
          '0%':   { opacity: '0', transform: 'scale(0.6) translateY(-20px)' },
          '65%':  { transform: 'scale(1.08) translateY(2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(-2deg)' },
          '50%':      { transform: 'translateY(-14px) rotate(2deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124, 58, 237, 0)' },
          '50%':      { boxShadow: '0 0 24px 6px rgba(124, 58, 237, 0.45)' },
        },
        'stat-pop': {
          '0%':   { transform: 'scale(0.9)' },
          '60%':  { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        'result-in': {
          '0%':   { opacity: '0', transform: 'translateY(30px) scale(0.95)' },
          '65%':  { transform: 'translateY(-4px) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'player-join': {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '60%':  { transform: 'translateX(4px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-6px) rotate(-1deg)' },
          '40%':      { transform: 'translateX(6px) rotate(1deg)' },
          '60%':      { transform: 'translateX(-4px)' },
          '80%':      { transform: 'translateX(4px)' },
        },
        'confetti': {
          '0%':   { opacity: '1', transform: 'translateY(0) rotate(0deg) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(200px) rotate(720deg) scale(0.3)' },
        },
        'pop-in': {
          '0%':   { opacity: '0', transform: 'scale(0.5)' },
          '65%':  { transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'timer-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
