const createBabelConfig = require('@porterjs/babel-config');

module.exports = function createEslintConfig(porterConfig) {
  const { eslint, babel, webpack, rollup } = porterConfig;
  const { files, useBabel = true, globals, ...otherConfig } = eslint;

  let overrideGlobals = globals;

  if (webpack) {
    overrideGlobals = {
      ...overrideGlobals,
      process: true
    };
    const { polyfills, defineMap = {}, globalPackageMap = {} } = webpack;
    if (polyfills) {
      const { babel, corejs, fetch } = polyfills;
      if (babel || corejs) {
        // TODO - add other core-js globals
        overrideGlobals = {
          ...overrideGlobals,
          Promise: true,
          Symbol: true,
          Buffer: true
        };
      }
      if (fetch) {
        overrideGlobals = {
          ...overrideGlobals,
          fetch: true
        };
      }
    }
    for (let defineKey of Object.keys(defineMap)) {
      overrideGlobals[defineKey] = true;
    }
    for (let globalPackageKey of Object.keys(globalPackageMap)) {
      overrideGlobals[globalPackageKey] = true;
    }
  }

  if (rollup) {
    const { globalPackages } = rollup;
    if (globalPackages) {
      overrideGlobals = {
        ...overrideGlobals
      };
      for (let globalPackageKey of Object.keys(globalPackages)) {
        // for rollup, the globals are the values instead of the key...
        overrideGlobals[globalPackages[globalPackageKey]] = true;
      }
    }
  }

  if (babel && useBabel) {
    const { parser = '@babel/eslint-parser', parserOptions = {}, ...otherOptions } = otherConfig;

    const { targets, options, presets, plugins } = babel;

    // @babel/eslint-parser no longer provides default parserOptions, so use defaults like babel-eslint did:
    // https://github.com/babel/babel-eslint/blob/6398dac79448a9ac2c8bd3109795433f86799529/lib/index.js#L27
    parserOptions.ecmaVersion = parserOptions.ecmaVersion || 2018;
    parserOptions.sourceType = parserOptions.sourceType || "module";
    parserOptions.allowImportExportEverywhere = parserOptions.allowImportExportEverywhere || false;

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