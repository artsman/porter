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
    }
  },
  rollup: {
    useEslint: false,
    log: false,
    name: 'PorterRollupDemo',
    licenseFile: 'LICENSE',
    inputFile: "src/index.js",
    analyze: true,
    umdOutputFile: "dist/porter-rollup-demo.js",
    minOutputFile: "dist/porter-rollup-demo.min.js"
  },
  eslint: {
    rules: {
      "semi": ["error", "always"]
    },
    plugins: [
      "import"
    ],
    extends: [
      "eslint:recommended",
      "plugin:import/errors"
    ],
    settings: {
    },
    env: {
      "browser": true,
      "es6": true
      // "node": true
    },
    files: 'src'
  }
};