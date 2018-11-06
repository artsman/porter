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
    log: false,
    name: 'PorterRollupDemo',
    licenseFile: 'LICENSE',
    inputFile: "src/index.js",
    analyze: true,
    umdOutputFile: "dist/porter-rollup-demo.js",
    minOutputFile: "dist/porter-rollup-demo.min.js"
  }
};