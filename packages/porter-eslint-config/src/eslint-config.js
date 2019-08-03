const createBabelConfig = require('@porterjs/babel-config');

module.exports = function createEslintConfig(porterConfig) {
  const { eslint, babel, webpack } = porterConfig;
  const { files, useBabel = true, globals, ...otherConfig } = eslint;

  let overrideGlobals = globals;

  if (webpack) {
    overrideGlobals = {
      ...overrideGlobals,
      process: true
    };
    const { defineMap = {}, globalPackageMap = {} } = webpack;
    for (let defineKey of Object.keys(defineMap)) {
      overrideGlobals[defineKey] = true;
    }
    for (let globalPackageKey of Object.keys(globalPackageMap)) {
      overrideGlobals[globalPackageKey] = true;
    }
  }

  if (babel && useBabel) {
    // TODO - change default parser back to "babel-eslint" once https://github.com/babel/babel-eslint/pull/784 is released
    const { parser = 'babel-eslint-fork', parserOptions = {}, ...otherOptions } = otherConfig;

    const { targets, options, presets, plugins } = babel;

    const babelConfig = createBabelConfig({ targets, options, mode: 'test', modules: true, presets, plugins });

    return {
      ...otherOptions,
      globals: overrideGlobals,
      parser,
      parserOptions: {
        ...parserOptions,
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          ...babelConfig
        }
      }
    };
  }
  else {
    if (overrideGlobals !== globals) {
      return {
        ...otherConfig,
        globals: overrideGlobals
      };
    }
    else {
      return otherConfig;
    }
  }
};