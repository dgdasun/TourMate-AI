/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        // Sri Lanka Tourism blue and gold
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd6ff',
          300: '#8ebcff',
          400: '#5996fb',
          500: '#3473f5',
          600: '#1e55e0',
          700: '#1743b5',
          800: '#0b3d91',
          900: '#072a66',
          950: '#051a40'
        },
        gold: {
          300: '#ffe066',
          400: '#ffd21f',
          500: '#f5c400',
          600: '#d4a600'
        },
        series: {
          1: 'rgb(var(--series-1) / <alpha-value>)',
          2: 'rgb(var(--series-2) / <alpha-value>)'
        }
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgb(11 61 145 / 0.12)'
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } }
      },
      animation: {
        float: 'float 5s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
