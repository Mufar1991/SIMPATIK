/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#0f301e',
          hover: '#1a4a2e',
          active: '#2d7a3e',
        },
        primary: {
          50: '#f0faf3',
          100: '#dcf5e4',
          200: '#bbe9cb',
          300: '#88d6a6',
          400: '#52bc7a',
          500: '#2d7a3e',
          600: '#256634',
          700: '#1f5229',
          800: '#1a4422',
          900: '#0f301e',
          950: '#071a10',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
