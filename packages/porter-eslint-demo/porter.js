module.exports = {
  eslint: {
    rules: {
      "semi": ["error", "always"],
    //   // "quotes": ["error", "double"]
    },
    plugins: ["import", "react"],
    extends: [
      "eslint:recommended",
      "plugin:import/errors",
      "plugin:react/recommended"
    ],
    settings: {
      "react": {
        "version": "16"
      }
    },
    // TODO - change back to "babel-eslint" once https://github.com/babel/babel-eslint/pull/784 is released
    parser: "babel-eslint-fork",
    parserOptions: {
      "ecmaVersion": 6,
      "sourceType": "module",
      "ecmaFeatures": {
        "jsx": true
      }
    },
    env: {
      "browser": true,
      // "node": true
    },
    files: 'src'
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
      objectRestSpread: true,
      reactJsx: true,
      forOfAsArray: false,
      reactRemovePropTypes: false,
      transformImportsMap: false,
      rewire: false
    }
  }
};