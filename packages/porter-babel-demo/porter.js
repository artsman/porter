module.exports = {
  babel: {
    targets: [
      "> 4%",
      "ie 11",
      "safari 8"
    ],
    options: {
      decorators: false,
      exportDefaultFrom: false,
      classProperties: true,
      privateMethods: false,
      nullishCoalescing: false,
      objectRestSpread: true,
      optionalChaining: false,
      reactPreset: false,
      reactJsx: false,
      reactDisplayName: false,
      forOfAsArray: false,
      inlineImportExtensions: ['.txt'],
      reactRemovePropTypes: false,
      transformImportsMap: false,
      reactHotLoader: false,
      rewire: false
    },
    extensions: ['.js', '.jsx'],
    inputPath: "src",
    cjsOutputPath: "lib",
    esOutputPath: "es"
  }
};