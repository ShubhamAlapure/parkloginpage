/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        park: {
          cream: '#FAF6EE',
          'cream-dark': '#F0EAD6',
          sage: '#9DB59A',
          'sage-light': '#C5D6C3',
          'sage-dark': '#6B8A68',
          forest: '#1F3A2D',
          'forest-light': '#2D5240',
          terracotta: '#D9765B',
          'terracotta-dark': '#BC583D',
          gold: '#F2C879',
          'gold-light': '#FDE2A6',
          sky: '#BFE3F2',
          'sky-dark': '#8BC3DA',
          bark: '#5C4033',
        }
      },
      fontFamily: {
        serif: ['"Fraunces"', '"Playfair Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glass': '0 20px 50px -10px rgba(31, 58, 45, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.4) inset',
        'glass-hover': '0 25px 60px -10px rgba(31, 58, 45, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
        'glow': '0 0 25px rgba(217, 118, 91, 0.35)',
        'glow-gold': '0 0 25px rgba(242, 200, 121, 0.45)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
