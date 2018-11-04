const createBaseBabelConfig = require("@porterjs/babel-config");

module.exports =function createBabelConfig({ targets, options, mode, modules = true, presets = [], plugins = [] }) {
  return createBaseBabelConfig({ targets, options, mode, modules, presets, plugins });
}