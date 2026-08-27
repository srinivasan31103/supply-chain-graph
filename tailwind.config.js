/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain: '#0b0f19',
        bgCard: '#151b2c',
        bgCardHover: '#1c253c',
        borderColor: '#25304b',
        colorSupplier: '#a855f7',
        colorComponent: '#f97316',
        colorProduct: '#14b8a6',
        colorFacility: '#3b82f6',
        colorOrder: '#eab308',
        textPrimary: '#f3f4f6',
        textSecondary: '#9ca3af',
        textMuted: '#6b7280',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
