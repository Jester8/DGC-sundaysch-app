/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#9d00d4",
        darkBg: "#000000",
        darkCard: "#1a1a1a",
        darkBorder: "#444444",
        lightBg: "#ffffff",
        lightCard: "#ffffff",
        lightBorder: "#cccccc",
        locked: "#888888",
      },
      fontFamily: {
        poppins: ["Poppins_400Regular", "sans-serif"],
        "poppins-medium": ["Poppins_500Medium", "sans-serif"],
        "poppins-semibold": ["Poppins_600SemiBold", "sans-serif"],
        "poppins-bold": ["Poppins_700Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};