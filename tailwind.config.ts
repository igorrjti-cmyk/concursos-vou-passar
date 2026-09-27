import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#f3f6fb",
          light: "#aeb9cb",
          dark: "#070b14",
        },
        paper: "#0b1020",
        gold: {
          DEFAULT: "#d6a84f",
          light: "#f0c96b",
        },
        errado: "#ef6a6a",
        certo: "#58c792",
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
