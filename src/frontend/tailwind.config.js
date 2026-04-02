/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        secondary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      backgroundImage: {
        'hero-gradient':   'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        'card-gradient':   'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
        'primary-gradient':'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        'violet-gradient': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%)',
        'shimmer':         'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card':  '0 4px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.5) inset',
        'glow':  '0 0 24px rgba(124,58,237,0.4)',
        'glow-sm':'0 0 12px rgba(124,58,237,0.25)',
        'lift':  '0 16px 48px rgba(0,0,0,0.15)',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':     { transform: 'translateY(-18px) rotate(3deg)' },
          '66%':     { transform: 'translateY(-8px) rotate(-2deg)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.35)' },
          '50%':     { boxShadow: '0 0 20px 6px rgba(124,58,237,0.35)' },
        },
      },
      animation: {
        'fade-in-up':  'fadeInUp 0.6s ease both',
        'shimmer':     'shimmer 2.4s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'pulse-glow':  'pulseGlow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
