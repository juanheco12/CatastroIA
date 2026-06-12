import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0F172A",
          surface: "#1E293B",
          muted: "#334155",
          primary: "#3B82F6",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          text: "#F1F5F9",
          "text-muted": "#CBD5E1",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
