import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1b2a4a",
          light: "#2b3d63",
          dark: "#101a30",
        },
        paper: "#f6f4ee",
        gold: {
          DEFAULT: "#c08a28",
          light: "#e0b45c",
        },
        errado: "#a3372f",
        certo: "#2f6b4f",
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
