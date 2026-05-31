/** @type {import('tailwindcss').Config} */
export default {
  content:[
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme:{
    extend:{
      colors:{
        darkBg:"#F8FAFC",

        darkCard:"#FFFFFF",

        primaryAqua:"#0F766E",

        primaryEmerald:"#16A34A",

        alertRed:"#DC2626",

        warningYellow:"#D97706",

        slateBorder:"#E2E8F0",

        slateText:"#0F172A",

        slateMuted:"#64748B"
      },

      fontFamily:{
        sans:["Inter","sans-serif"]
      },

      boxShadow:{
        glass:"0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(15,23,42,.06)",

        aquaGlow:"0 2px 8px rgba(15,23,42,.08)",

        emeraldGlow:"0 2px 8px rgba(15,23,42,.08)",

        redGlow:"0 2px 8px rgba(15,23,42,.08)"
      }
    }
  },
  plugins:[]
}