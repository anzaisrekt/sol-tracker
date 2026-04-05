import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sol: {
          darker: 'rgb(var(--sol-darker) / <alpha-value>)',
          dark: 'rgb(var(--sol-dark) / <alpha-value>)',
          card: 'rgb(var(--sol-card) / <alpha-value>)',
          border: 'rgb(var(--sol-border) / <alpha-value>)',
          hover: 'rgb(var(--sol-hover) / <alpha-value>)',
          accent: 'rgb(var(--sol-accent) / <alpha-value>)',
          accent2: 'rgb(var(--sol-accent2) / <alpha-value>)',
          accent3: 'rgb(var(--sol-accent3) / <alpha-value>)',
          text: 'rgb(var(--sol-text) / <alpha-value>)',
          muted: 'rgb(var(--sol-muted) / <alpha-value>)',
          warn: 'rgb(var(--sol-warn) / <alpha-value>)',
          error: 'rgb(var(--sol-error) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["dark", "light"],
    darkTheme: "dark",
  },
}
