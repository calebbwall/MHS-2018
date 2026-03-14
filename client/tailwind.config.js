/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Magnolia High School Bulldogs — maroon & white
        maroon: {
          50:  '#fdf2f2',
          100: '#fce4e4',
          200: '#f9c0c0',
          300: '#f48585',
          400: '#ec4a4a',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#8b0000',
          800: '#670000',  // primary school maroon
          900: '#450000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
