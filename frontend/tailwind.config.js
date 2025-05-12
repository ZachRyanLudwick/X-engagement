/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'twitter-blue': '#1DA1F2',
        'twitter-black': '#14171A',
        'twitter-dark-gray': '#657786',
        'twitter-light-gray': '#AAB8C2',
        'twitter-extra-light-gray': '#E1E8ED',
        'twitter-white': '#F5F8FA',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'tweet': '0 0 10px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}