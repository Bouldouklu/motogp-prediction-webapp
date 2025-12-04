import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'motogp-red': '#cc0000',
        'motogp-dark': '#0f172a',
        'motogp-silver': '#e2e8f0',
        'carbon-black': '#121212',
        'track-gray': '#1a1a1a',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-racing)'],
      },
      backgroundImage: {
        'checkered': "repeating-linear-gradient(45deg, #1a1a1a 25%, transparent 25%, transparent 75%, #1a1a1a 75%, #1a1a1a), repeating-linear-gradient(45deg, #1a1a1a 25%, #0f172a 25%, #0f172a 75%, #1a1a1a 75%, #1a1a1a)",
      },
      skew: {
        '20': '20deg',
      }
    },
  },
  plugins: [],
};
export default config;
