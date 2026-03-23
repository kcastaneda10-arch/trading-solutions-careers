import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ts: {
          black: "#000000",
          white: "#FFFFFF",
          bg: "#EBEBEB",
          gray: "#F5F5F5",
          muted: "#6B7280",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
