const { Platform } = require('react-native');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'hsl(0, 0%, 4%)',
        foreground: 'hsl(0, 0%, 100%)',
        card: 'hsl(0, 0%, 10%)',
        'card-foreground': 'hsl(0, 0%, 100%)',
        'surface-1': 'hsl(0, 0%, 13%)',
        'surface-2': 'hsl(0, 0%, 16%)',
        'surface-3': 'hsl(0, 0%, 7%)',
        primary: 'hsl(252, 62%, 63%)',
        'primary-foreground': 'hsl(0, 0%, 100%)',
        accent: 'hsl(252, 62%, 63%)',
        muted: 'hsl(0, 0%, 20%)',
        'muted-foreground': 'hsl(0, 0%, 60%)',
        border: 'hsl(0, 0%, 15%)',
        success: 'hsl(142, 71%, 45%)',
        warning: 'hsl(38, 92%, 50%)',
        destructive: 'hsl(0, 84%, 60%)',
        'destructive-foreground': 'hsl(0, 0%, 100%)',
        info: 'hsl(199, 89%, 48%)',
      },
      fontFamily: {
        sans: Platform.select({
          ios: ['System'],
          default: ['Inter-Regular', 'System'],
        }),
        'sans-medium': Platform.select({
          ios: ['System'],
          default: ['Inter-Medium', 'System'],
        }),
        'sans-semibold': Platform.select({
          ios: ['System'],
          default: ['Inter-SemiBold', 'System'],
        }),
        'sans-bold': Platform.select({
          ios: ['System'],
          default: ['Inter-Bold', 'System'],
        }),
      },
      fontSize: {
        largeTitle: ['34px', { lineHeight: '41px', fontWeight: '400' }],
        title1: ['28px', { lineHeight: '34px', fontWeight: '400' }],
        title2: ['22px', { lineHeight: '28px', fontWeight: '400' }],
        title3: ['20px', { lineHeight: '25px', fontWeight: '400' }],
        headline: ['17px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['17px', { lineHeight: '22px', fontWeight: '400' }],
        callout: ['16px', { lineHeight: '21px', fontWeight: '400' }],
        subhead: ['15px', { lineHeight: '20px', fontWeight: '400' }],
        footnote: ['13px', { lineHeight: '18px', fontWeight: '400' }],
        caption1: ['12px', { lineHeight: '16px', fontWeight: '400' }],
        caption2: ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
