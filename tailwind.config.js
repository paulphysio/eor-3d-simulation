/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        oil: '#f0a030',
        steam: '#ff6b35',
        water: '#4a9eff',
        rock: '#2a1a0a',
        deep: '#0a0f1a',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
