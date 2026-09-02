import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FBF6EC",
          soft: "#F5EFDF",
        },
        teal: {
          50: "#EAF6F1",
          100: "#CDEAE0",
          200: "#9DD5C1",
          300: "#6CBFA2",
          400: "#3FA98A",
          500: "#1E8E70",
          600: "#14735A",
          700: "#105E49",
          800: "#0D4A3A",
          900: "#0A3A2E",
        },
        coral: {
          100: "#FBE4E0",
          300: "#F0AFA5",
          500: "#E3897B",
          700: "#B9584A",
        },
        amber: {
          100: "#FBEFD3",
          300: "#F2D18E",
          500: "#E3AC44",
          700: "#A67420",
        },
        ink: "#26332E",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(38, 51, 46, 0.06), 0 8px 24px rgba(38, 51, 46, 0.05)",
        card: "0 1px 2px rgba(38, 51, 46, 0.04), 0 4px 16px rgba(38, 51, 46, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
