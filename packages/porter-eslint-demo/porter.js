module.exports = {
  eslint: {
    rules: {
      "semi": ["error", "always"],
      "react/prop-types": [0],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-unused-vars": ["error", { ignoreRestSiblings: true }],
      "prettier/prettier": ["error", { singleQuote: true, usePrettierrc: false, printWidth: 120 }]
    },
    plugins: ["import", "react", "prettier"],
    extends: ["eslint:recommended", "plugin:import/errors", "plugin:react/recommended", "plugin:prettier/recommended"],
    settings: {
      react: {
        version: "detect"
      }
    },
    env: {
      browser: true,
      es6: true,
      jest: true
    },
    files: ["src", "porter.js"]
  },
  babel: {
    targets: [
      "> 4%",
      "ie 11",
      "safari 8"
    ],
    options: {
      decorators: false,
      classProperties: true,
      privateMethods: true,
      objectRestSpread: true,
      reactJsx: true,
      forOfAsArray: false,
      reactRemovePropTypes: false,
      transformImportsMap: false,
      rewire: false
    }
  }
};