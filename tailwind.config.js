/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--typography-font-sans)'],
        mono: ['var(--typography-font-mono)'],
      },
      colors: {
        sidebar: 'rgb(var(--tw-color-sidebar-rgb) / <alpha-value>)',
        primary: 'rgb(var(--tw-color-primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--tw-color-secondary-rgb) / <alpha-value>)',
      },
      borderRadius: {
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
      },
      boxShadow: {
        panel: 'var(--shadow-sm)',
        overlay: 'var(--shadow-lg)',
        focus: 'var(--shadow-focus)',
      }
    },
  },
  plugins: [],
}
