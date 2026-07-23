import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        space: {
          void:    '#000000',
          deep:    '#040008',
          mid:     '#070010',
          surface: '#0C0018',
          raised:  '#110022',
        },
        nova: {
          red:        '#FF0033',
          redBright:  '#FF1744',
          redDeep:    '#C62828',
          blue:       '#0066FF',
          blueBright: '#2979FF',
          blueDeep:   '#1565C0',
          cyan:       '#00B0FF',
          orange:     '#FF6D00',
          white:      '#F0F4FF',
        },
      },
    },
  },
  plugins: [],
};

export default config;
