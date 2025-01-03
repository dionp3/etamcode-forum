/** @type {import('tailwindcss').Config} */
const { light, dark } = require('daisyui/src/theming/themes')
const primary = '#237199'
const secondary = '#C8565B'
const accent = '#F5CCCC'
export default {
  content: [
    './resources/**/*.edge',
    './inertia/components/**/*.{js,ts,vue}',
    './inertia/layouts/**/*.{js,ts,vue}',
    './inertia/pages/**/*.{js,ts,vue}',
  ],
  theme: {
    extend: {
      fontSize: {
        xs: '0.8125rem', // 13px
        sm: '0.875rem', // 14px
        base: '0.9375rem', // 15px
        lg: '1rem', // 16px
        xl: '1.0625rem', // 17px
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    logs: false,
    themes: [
      {
        light: {
          ...light,
          primary: primary,
          secondary: secondary,
          accent: accent,
        },
        dark: {
          ...dark,
          primary: primary,
          secondary: secondary,
          accent: accent,
        },
      },
    ],
  },
}
