const path = require('path');
const babelCore = require('@babel/core');
const includes = require("lodash/includes");
const loadPorterConfig = require("@porterjs/config");
const createBabelConfig = require("@porterjs/babel-config");

const porterConfig = loadPorterConfig(process.cwd(), process.argv);

const { babel } = porterConfig;
const { targets, options, presets, plugins } = babel;

const babelConfig = createBabelConfig({ targets, options, mode: 'not-production', modules: true, presets, plugins });

function isCompilableExtension(filename, forcedExts) {
  const exts = forcedExts || babelCore.DEFAULT_EXTENSIONS;
  const ext = path.extname(filename);
  return includes(exts, ext);
}

module.exports = {
  process(src, filename) {
    if (isCompilableExtension(filename)) {
      return babelCore.transform(src, {
        filename,
        presets: babelConfig.presets,
        plugins: babelConfig.plugins
      });
    }
    return src;
  },
};