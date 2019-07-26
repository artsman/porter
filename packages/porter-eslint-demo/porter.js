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
    parser: "babel-eslint",
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
  }
};