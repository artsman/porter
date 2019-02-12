module.exports = {
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
      reactJsx: false,
      forOfAsArray: false,
      reactRemovePropTypes: false,
      transformImportsMap: false,
      rewire: false
    },
    inputPath: "src",
    cjsOutputPath: "lib",
    esOutputPath: "es"
  },
  eslint: {
    files: ["src"],
    "env": {
      "browser": true,
      "es6": true,
      "node": true
    },
    "extends": [
      "eslint:recommended"
    ],
    "parserOptions": {
      "ecmaFeatures": {
        "jsx": true
      },
      "ecmaVersion": 2018,
      "sourceType": "module"
    },
    "plugins": [
      "react"
    ],
    "rules": {
      "indent": [
        "error",
        2
      ],
      "linebreak-style": [
        "error",
        "unix"
      ],
      // "quotes": [
      //     "error",
      //     "double"
      // ],
      "semi": [
        "error",
        "always"
      ]
    }
  }
};