/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'hsl(0, 0%, 4%)',
        foreground: 'hsl(0, 0%, 100%)',
        card: 'hsl(0, 0%, 10%)',
        'card-foreground': 'hsl(0, 0%, 100%)',
        primary: 'hsl(252, 62%, 63%)',
        'primary-foreground': 'hsl(0, 0%, 100%)',
        muted: 'hsl(0, 0%, 20%)',
        'muted-foreground': 'hsl(0, 0%, 60%)',
        border: 'hsl(0, 0%, 15%)',
        success: 'hsl(142, 71%, 45%)',
        warning: 'hsl(38, 92%, 50%)',
        destructive: 'hsl(0, 84%, 60%)',
        'destructive-foreground': 'hsl(0, 0%, 100%)',
        info: 'hsl(199, 89%, 48%)',
      },
    },
  },
  plugins: [],
};
