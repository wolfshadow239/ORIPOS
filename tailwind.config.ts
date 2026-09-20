
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1428A0',
          dark: '#0B1B6E',
          deep: '#0A1230',
          light: '#EEF1FC',
          accent: '#00A9E0',
        },
        ink: '#0F172A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
        lift: '0 8px 24px rgba(10,18,48,.14)',
      },
    },
  },
  plugins: [],
};
export default config;
