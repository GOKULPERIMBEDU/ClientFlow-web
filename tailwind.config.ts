import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#eef3f8",
          100: "#d5e0ec",
          700: "#243044",
          800: "#172033",
          900: "#101827",
          950: "#0b1220",
        },
        aqua: {
          50: "#edfaf7",
          100: "#d2f3eb",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0f766e",
          700: "#0b5c56",
        },
        canvas: "#f4f1ea",
        paper: "#fcfbf8",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 39, 0.06), 0 12px 32px rgba(16, 24, 39, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
