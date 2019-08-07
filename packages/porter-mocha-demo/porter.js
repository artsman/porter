module.exports = {
  babel: {
    targets: ["> 4%", "ie 11", "safari 8"],
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
  mocha: {
    files: ["test"]
  }
};