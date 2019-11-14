module.exports = {
  env: {
    browser: true,
    jquery: true,
    es6: true,
  },
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  extends: ["eslint:recommended", "plugin:react/recommended", ".eslintrc.base.js"],
  rules: {
    semi: 0,
    "brace-style": 0,
    "comma-style": 0,
  },
  globals: {
    Chart: true,
    Cookies: true,
    flatpickr: true,
    FS: true,
    heap: true,
    Highcharts: true,
    Intercom: true,
    Stripe: true,
    THREE: true,
    Tablesort: true,
  },
}
