/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Status colors — what's true about a street (functional, not brand)
        adopted: '#07C160',
        pending: '#F2994A',
        available: '#94A3B8',

        // South Alive brand — used for CTAs/accents so the embedded map
        // feels native to their WordPress site
        brand: '#FFD401',

        // Neutrals
        ink: '#1C2B26',
        paper: '#F7F5F0',
        line: '#D8D3C7',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
