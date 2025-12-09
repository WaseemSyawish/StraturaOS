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
      // Modal and search animations
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'zoom-in-95': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'zoom-out-95': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        'slide-in-from-top-4': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-bottom-4': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-out': 'fade-out 0.15s ease-out',
        'zoom-in-95': 'zoom-in-95 0.2s ease-out',
        'zoom-out-95': 'zoom-out-95 0.2s ease-out',
        'slide-in-from-top-4': 'slide-in-from-top-4 0.2s ease-out',
        'slide-in-from-bottom-4': 'slide-in-from-bottom-4 0.3s ease-out',
        'modal-in': 'zoom-in-95 0.3s ease-out, slide-in-from-bottom-4 0.3s ease-out',
        'search-in': 'zoom-in-95 0.2s ease-out, slide-in-from-top-4 0.2s ease-out',
      },
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