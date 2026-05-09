import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#E6F7F2',
          100: '#A8E0CE',
          300: '#5CBFA3',
          500: '#1A9E78',
           600: '#0D8B64',
           700: '#0D7257',
          900: '#074D3A',
        },
        secondary: {
          50: '#EBF5E0',
          100: '#B8DFA0',
          300: '#72B84A',
          500: '#3D8C18',
          700: '#266210',
          900: '#153E08',
        },
        tertiary: {
          50: '#FEF7E6',
          100: '#FDDFA0',
          300: '#F8B830',
          500: '#D48A00',
          700: '#9A6200',
          900: '#5C3A00',
        },
        neutral: {
          50: '#F4F6F8',
          100: '#DDE3EA',
          300: '#A8B6C4',
          500: '#6A7F92',
          700: '#3A4A58',
          900: '#1A2530',
        },
        sand: {
          50: '#FAF8F4',
          100: '#EDE8DC',
          300: '#CFC4A8',
          500: '#A89070',
          700: '#6E5C40',
          900: '#3A2E14',
        },
        error: {
          DEFAULT: '#E8392A',
          bg: '#FDECEA',
        },
        success: {
          DEFAULT: '#3D8C18',
          bg: '#EBF5E0',
        },
        warning: {
          DEFAULT: '#D48A00',
          bg: '#FEF7E6',
        },
        info: {
          DEFAULT: '#1A9E78',
          bg: '#E6F7F2',
        },
      },
      fontSize: {
        'display-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'display-md': ['26px', { lineHeight: '34px', fontWeight: '700' }],
        'display-sm': ['22px', { lineHeight: '30px', fontWeight: '700' }],
        'headline-lg': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'headline-md': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'headline-sm': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'title-lg': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'title-md': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'title-sm': ['13px', { lineHeight: '18px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-md': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        micro: ['11px', { lineHeight: '14px', fontWeight: '500' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 8px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.10)',
        focus: '0 0 0 3px rgba(26,158,120,0.25)',
      },
    },
  },
  plugins: [],
}

export default config
