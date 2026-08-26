/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        card:       '#1E1E1E',
        'card-hover': '#252525',
        border:     '#2A2A2A',
        'text-primary': '#F3F4F6',
        'text-muted':   '#9CA3AF',
        gold:       '#C5A059',
        'gold-light': '#D4B47A',
        'gold-dark':  '#A8883F',
        positive:   '#2E7D32',
        'positive-light': '#4CAF50',
        negative:   '#C62828',
        'negative-light': '#EF5350',
        warning:    '#F59E0B',
        info:       '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.6)',
        gold: '0 0 12px rgba(197,160,89,0.25)',
      },
    },
  },
  plugins: [],
}
