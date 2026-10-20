/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* v7 "Snap Pop" — ink is near-black, used for text, borders and
           hard shadows ONLY (never large surfaces). */
        ink: {
          DEFAULT: '#141414',
          soft: '#3D3D38',
          mute: '#7C7668',
        },
        line: '#141414',
        sun: '#FFCE00',
        sunsoft: '#FFDF4D',
        paper: '#FFF9E8',
        cream: '#FFF9E8',
        /* flat vivid tints (legacy names kept so pages inherit v7) */
        sky: '#FFF3B8',
        lav: '#EDE9FE',
        mint: '#DCFCE7',
        cyantint: '#D8F3FF',
        blush: '#FFD9EA',
        peach: '#FFE3B3',
        brand: {
          sky: '#38BDF8',
          deep: '#0284C7',
          violet: '#7C3AED',
          magenta: '#C026D3',
          pink: '#FF5CA8',
          cyan: '#06B6D4',
          coral: '#FF6B4A',
          gold: '#F59E0B',
          green: '#22C55E',
          emerald: '#10B981',
        },
      },
      fontFamily: {
        display: ['Unbounded', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        grotesk: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
      },
      boxShadow: {
        soft: '4px 4px 0 0 #141414',
        lift: '7px 7px 0 0 #141414',
        pop: '3px 3px 0 0 #141414',
        'hard-sm': '3px 3px 0 0 #141414',
        hard: '6px 6px 0 0 #141414',
        'hard-lg': '10px 10px 0 0 #141414',
      },
    },
  },
  plugins: [],
};
