/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#F8FAFC",
        darkCard: "#FFFFFF",
        primaryAqua: "#0F766E",
        primaryEmerald: "#115E59",
        alertRed: "#DC2626",
        warningYellow: "#D97706",
        success: "#16A34A",
        border: "#E2E8F0",
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
        textMuted: "#94A3B8",
      },
      fontFamily: {
        sans: ["Inter", "Outfit", "sans-serif"]
      },
      boxShadow: {
        glass: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        aquaGlow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        emeraldGlow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        redGlow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        cardHover: "0 4px 12px 0 rgba(0, 0, 0, 0.08)",
      }
    },
  },
  plugins: [],
}
