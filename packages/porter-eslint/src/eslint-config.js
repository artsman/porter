const loadPorterConfig = require("@porterjs/config");
const createBabelConfig = require("@porterjs/babel-config");

const porterConfig = loadPorterConfig(process.cwd(), process.argv);
const { eslint, babel } = porterConfig;

const { files, ...otherConfig } = eslint;

const { parserOptions, ...otherOptions } = otherConfig;

const { targets, options, presets, plugins } = babel;

const babelConfig = createBabelConfig({ targets, options, mode: 'test', modules: true, presets, plugins });

module.exports = {
  ...otherOptions,
  parserOptions: {
    ...parserOptions,
    requireConfigFile: false,
    babelOptions: {
      babelrc: false,
      ...babelConfig
    }
  }
};