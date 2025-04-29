/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        "off-white": "#F1EFEC",
        "deep-blue": "#123458",
        "soft-cream": "#FDFAF6", // Updated from light-beige
        "near-black": "#030303",
      },
    },
  },
  plugins: [],
};