import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'esdm-dark': '#1D2327',
        'esdm-yellow': '#FFF000',
        'esdm-gold': '#EAB308',
        'bdtbt-dark': '#0F172A',
        'bdtbt-yellow': '#FACC15',
        'bdtbt-green': '#23A455',
      }
    },
  },
  plugins: [],
}
export default config
