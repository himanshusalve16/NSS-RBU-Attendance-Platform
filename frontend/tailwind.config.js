/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',    // Small phones
        'sm': '640px',    // Large phones
        'md': '768px',    // Tablets
        'lg': '1024px',   // Small laptops
        'xl': '1280px',   // Desktops
        '2xl': '1536px',  // Large desktops
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
    },
  },
  plugins: [],
}
