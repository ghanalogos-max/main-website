import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gh: {
          red: "#CE1126",
          gold: "#FCD116",
          green: "#006B3F",
          black: "#0A0A0A",
        },
        ink: {
          950: "#07090A",
          900: "#0E1214",
          800: "#161B1E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Arial", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,10,10,0.04), 0 8px 24px -12px rgba(10,10,10,0.12)",
        lift: "0 2px 4px rgba(10,10,10,0.04), 0 18px 40px -16px rgba(0,107,63,0.35)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
