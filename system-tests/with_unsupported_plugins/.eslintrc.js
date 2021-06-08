module.exports = {
  extends: [
    "not_valid",
    "eslint:recommended",
    "plugin:node/recommended"
  ],
  plugins: [
    "node",
    "not_supported"
  ],
  rules: {
    "node/exports-style": ["error", module.exports],
    indent: [error, 4],
    linebreakStyle: ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    semi: ["error", "always"],
    noConsole: "off"
  }
};
