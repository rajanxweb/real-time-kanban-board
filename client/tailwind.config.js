/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F4F1EA',
        surface: {
          DEFAULT: '#FBFAF6',
          subtle: '#EFECE4',
        },
        'surface-subtle': '#EFECE4',
        ink: '#1B1A17',
        muted: '#6B665C',
        border: {
          DEFAULT: 'rgba(27, 26, 23, 0.14)',
          hover: 'rgba(27, 26, 23, 0.28)',
        },
        'border-hover': 'rgba(27, 26, 23, 0.28)',
        accent: '#E4572E',
        success: '#2E6F40',
        danger: '#C83E28',
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['"Instrument Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '3px',
        md: '3px',
        full: '9999px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        'space-1': '4px',
        'space-2': '8px',
        'space-3': '12px',
        'space-4': '16px',
        'space-5': '20px',
        'space-6': '24px',
        'space-8': '32px',
      },
      boxShadow: {
        drag: '0 4px 12px rgba(27, 26, 23, 0.12), 0 1px 3px rgba(27, 26, 23, 0.08)',
        modal: '0 8px 24px rgba(27, 26, 23, 0.14)',
        toast: '0 4px 12px rgba(27, 26, 23, 0.2)',
      },
    },
  },
  plugins: [],
};
