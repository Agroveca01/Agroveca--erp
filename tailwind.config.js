/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ctp-turquoise': '#00D4D4',
        'ctp-orange': '#FF8C42',
        'ctp-pink': '#FF10F0',
        'ctp-ruby': '#DC143C',
        'ctp-purple': '#9D4EDD',
        'ctp-lime': '#CCFF00',
        'ctp-cyan': '#00FFFF',
        'ctp-gold': '#FFD700',
        'ctp-coral': '#FF7F50',
        'ctp-mint': '#98FF98',
        'ctp-lavender': '#E6E6FA',
        'ctp-peach': '#FFDAB9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
