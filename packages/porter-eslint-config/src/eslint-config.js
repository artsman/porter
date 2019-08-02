const createBabelConfig = require('@porterjs/babel-config');

module.exports = function createEslintConfig(porterConfig) {
  const { eslint, babel } = porterConfig;
  const { files, ...otherConfig } = eslint;

  const { parserOptions = {}, ...otherOptions } = otherConfig;

  const { targets, options, presets, plugins } = babel;

  const babelConfig = createBabelConfig({ targets, options, mode: 'test', modules: true, presets, plugins });

  return {
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
};