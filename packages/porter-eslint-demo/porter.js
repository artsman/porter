module.exports = {
  eslint: {
    rules: {
      "semi": ["error", "always"]
    },
    plugins: [
      "import",
      "react"
    ],
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
    env: {
      "browser": true
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