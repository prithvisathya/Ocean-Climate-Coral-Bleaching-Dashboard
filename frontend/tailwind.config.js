/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#e8f4fc',
          100: '#c5e4f7',
          200: '#8ec9ef',
          300: '#52a8e0',
          400: '#2a8acc',
          500: '#1a6fad',
          600: '#155a8f',
          700: '#144a75',
          800: '#153f61',
          900: '#163651',
        },
        coral: {
          400: '#ff7f6b',
          500: '#ff6b5b',
          600: '#e8554a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
