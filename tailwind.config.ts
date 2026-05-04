import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        // Open Sauce Sans · alineado con tradingsolutions.com
        sans: ['"Open Sauce Sans"', '"Open Sans"', "system-ui", "sans-serif"],
        display: ['"Open Sauce Sans"', '"Open Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        ts: {
          black: "#000000",
          white: "#FFFFFF",
          bg: "#EBEBEB",
          gray: "#F5F5F5",
          dark100: "#0A0A0A",      // section bg-dark-100 del sitio
          dark80: "#1A1A1A",
          dark60: "rgba(0,0,0,0.6)",
          muted: "#6B7280",
          accent: "#000000",
        },
      },
      letterSpacing: {
        'ts-tight': '-0.02em',     // headings TS son -0.02em o más tight
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
