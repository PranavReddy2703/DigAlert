/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B111E",
        darkCard: "rgba(17, 24, 39, 0.65)",
        primaryAqua: "#00F2FE",
        primaryEmerald: "#05F0A4",
        alertRed: "#FF3366",
        warningYellow: "#FFD000"
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"]
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        aquaGlow: "0 0 15px rgba(0, 242, 254, 0.45)",
        emeraldGlow: "0 0 15px rgba(5, 240, 164, 0.45)",
        redGlow: "0 0 15px rgba(255, 51, 102, 0.45)",
      }
    },
  },
  plugins: [],
}
