/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    // Square corners or max 6px radius — nothing softer.
    borderRadius: {
      none: '0px',
      sm: '4px',
      DEFAULT: '6px',
      md: '6px',
      lg: '6px',
      xl: '6px',
      '2xl': '6px',
      '3xl': '6px',
      full: '9999px',
    },
    // 3px solid borders everywhere by default.
    borderWidth: {
      DEFAULT: '3px',
      0: '0px',
      2: '2px',
      4: '4px',
      8: '8px',
    },
    // Hard offset shadows with zero blur.
    boxShadow: {
      none: 'none',
      brutal: '5px 5px 0 #000',
      'brutal-sm': '3px 3px 0 #000',
      'brutal-invert': '5px 5px 0 #fff',
      'brutal-sm-invert': '3px 3px 0 #fff',
    },
    // Black borders by default; every color utility stays available.
    borderColor: ({ theme }) => ({
      ...theme('colors'),
      DEFAULT: '#000',
    }),
    fontFamily: {
      heading: ['"Archivo Black"', 'Impact', 'sans-serif'],
      body: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      serif: ['"Space Grotesk"', 'ui-serif', 'Georgia', 'serif'],
      mono2: ['"Space Mono"', 'ui-monospace', 'monospace'],
    },
    extend: {
      colors: {
        cream: '#FFF4E0',
        yellow: '#FFD84D',
        pink: '#FF6B9D',
        blue: '#4D9CFF',
        mint: '#7CFFB2',
        orange: '#FF9F43',
        red: '#FF4D4D',
        ink: '#000',
      },
      keyframes: {
        'brutal-pop': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'brutal-slide': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'brutal-pop': 'brutal-pop 160ms ease-out both',
        'brutal-slide': 'brutal-slide 200ms ease-out both',
      },
    },
  },
  plugins: [],
};
