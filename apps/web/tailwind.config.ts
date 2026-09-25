import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ink: '#172b4d',
        muted: '#70819b',
        brand: '#2c8a82',
        'brand-dark': '#1e6e69',
        cloud: '#f4f7fb',
        line: '#e5ebf3',
        coral: '#d96c5f',
        gold: '#e5a749',
      },
      boxShadow: { soft: '0 12px 36px rgba(31, 57, 88, .08)', card: '0 3px 16px rgba(30, 67, 99, .06)' },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
