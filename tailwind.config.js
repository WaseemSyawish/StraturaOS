module.exports = {
  darkMode: 'class',
  content: [
    // scan source, pages, components and app folders so Tailwind keeps classes used in pages/
    "./src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    // include mina-scheduler package for Tailwind class scanning
    "./node_modules/mina-scheduler/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom breakpoints for 4K and ultra-wide displays
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
        '5xl': '3000px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
      },
      colors: {
        status: {
          present: '#10B981', // green-500
          absent: '#EF4444',  // red-500
          late: '#F97316',    // orange-500
          excused: '#F59E0B', // yellow-500
          holiday: '#3B82F6'  // blue-500
        }
      },
      // Ensure gradient colors are included
      gradientColorStops: theme => theme('colors'),
    },
  },
  // Make daisyui optional so dev doesn't fail if native deps aren't installed
  plugins: (function () {
    try {
      const d = require('daisyui')
      return [d]
    } catch (err) {
      console.warn('daisyui not installed; continuing without it')
      return []
    }
  })(),
  // Only export daisyui config if the package is present
  daisyui: (function () {
    try {
      require.resolve('daisyui')
      return {
        themes: ['light', 'dark'],
        darkTheme: 'dark'
      }
    } catch (err) {
      return undefined
    }
  })()
}