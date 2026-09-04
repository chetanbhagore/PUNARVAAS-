/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          ink: "#16232E",
          bg: "#EDF0F2",
          card: "#FFFFFF",
          border: "#DDE3E8",
          accent: "#3D5A73",
          secondary: "#5C6B76",
        },
        severity: {
          red: "#C13F3F",
          orange: "#D97A2E",
          yellow: "#E0B33C",
          green: "#3F8F5F",
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
