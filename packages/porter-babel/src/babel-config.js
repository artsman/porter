const createBaseBabelConfig = require("@porterjs/babel-config");

module.exports =function createBabelConfig({ plugins = [], ...rest }) {
  let babelVersion = "7.5.0";
  try {
    babelVersion = require('@babel/helpers/package.json').version;
  } catch (ex) {}
  plugins = plugins.concat([["@babel/plugin-transform-runtime", { version: babelVersion }]]);
  return createBaseBabelConfig({ ...rest, plugins });
}