module.exports = {
  eslint: {
    rules: {
      "semi": ["error", "always"],
      "quotes": ["error", "double"]
    },
    parserOptions: {
      "ecmaVersion": 6,
      "sourceType": "module",
      "ecmaFeatures": {
        "jsx": true
      }
    },
    files: 'src'
  }
};