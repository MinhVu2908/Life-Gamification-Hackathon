/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"EB Garamond"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        salarDark: '#0B0C15',
        salarCard: '#161827',
      }
    },
  },
  plugins: [],
}