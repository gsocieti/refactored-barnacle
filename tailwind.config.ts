import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { mie: '#FFF4DF', cabai: '#C62828', kuah: '#35211A' },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-body)', 'sans-serif'],
      },
      boxShadow: { chunky: '4px 4px 0 0 #3B2216' },
    },
  },
  plugins: [],
};
export default config;
