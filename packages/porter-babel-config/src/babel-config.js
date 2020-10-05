const porterBabelPluginEnv = {
  pluginMap: {
    decorators: ["@babel/plugin-proposal-decorators", { "legacy": true }],
    exportDefaultFrom: "@babel/plugin-proposal-export-default-from",
    classProperties: "@babel/plugin-proposal-class-properties",
    privateMethods: "@babel/plugin-proposal-private-methods",
    nullishCoalescing: "@babel/plugin-proposal-nullish-coalescing-operator",
    objectRestSpread: "@babel/plugin-proposal-object-rest-spread",
    optionalChaining: "@babel/plugin-proposal-optional-chaining",
    reactJsx: "@babel/plugin-transform-react-jsx",
    reactDisplayName: "@babel/plugin-transform-react-display-name",
    forOfAsArray: ["@babel/plugin-transform-for-of", { "assumeArray": true }]
  },
  pluginFunctionMap: {
    inlineImportExtensions: function (inlineImportExtensions) {
      return ["babel-plugin-inline-import", {
        "extensions": [
          inlineImportExtensions
        ]
      }];
    }
  },
  production: {
    pluginMap: {
      reactRemovePropTypes: "babel-plugin-transform-react-remove-prop-types"
    },
    pluginFunctionMap: {
      transformImportsMap: function (transformMap) {
        let transformImports = {};
        let transformKeys = Object.keys(transformMap);
        for (let transformKey of transformKeys) {
          transformImports[transformKey] = {
            transform: transformMap[transformKey],
            preventFullImport: true
          };
        }
        return ["transform-imports", transformImports];
      }
    }
  },
  development: {
    pluginMap: {
      reactHotLoader: "react-hot-loader/babel"
    },
    pluginFunctionMap: {}
  },
  test: {
    pluginMap: {
      rewire: "babel-plugin-rewire"
    },
    pluginFunctionMap: {}
  }
};

const porterBabelPresetEnv = {
  presetMap: {
    reactPreset: "@babel/preset-react"
  },
  presetFunctionMap: {}
};

const getPluginsOrPresetsForOptions = (options, mode, porterBabelEnv, pluginOrPresetMapKey, pluginOrPresetFunctionMapKey) => {
  let pluginOrPresetMap = { ...porterBabelEnv[pluginOrPresetMapKey] };
  let pluginOrPresetFunctionMap = { ...porterBabelEnv[pluginOrPresetFunctionMapKey] }; 
  if (porterBabelEnv[mode]) {
    pluginOrPresetMap = { ...pluginOrPresetMap, ...porterBabelEnv[mode][pluginOrPresetMapKey] };
    pluginOrPresetFunctionMap = { ...pluginOrPresetFunctionMap, ...porterBabelEnv[mode][pluginOrPresetFunctionMapKey] };
  }
  const possibleOptionKeys = Object.keys(pluginOrPresetMap).concat(Object.keys(pluginOrPresetFunctionMap));

  const pluginsOrPresets = [];

  for (let optionKey of possibleOptionKeys) {
    if (options[optionKey] !== false) {
      if (pluginOrPresetMap[optionKey]) {
        pluginsOrPresets.push(pluginOrPresetMap[optionKey]);
      }
      else if (pluginOrPresetFunctionMap[optionKey]) {
        pluginsOrPresets.push(pluginOrPresetFunctionMap[optionKey](options[optionKey]));
      }
    }
  }
  return pluginsOrPresets;
};

const getPluginsForOptions = (options, mode) => {
  return getPluginsOrPresetsForOptions(options, mode, porterBabelPluginEnv, 'pluginMap', 'pluginFunctionMap')
}

const getPresetsForOptions = (options, mode) => {
  return getPluginsOrPresetsForOptions(options, mode, porterBabelPresetEnv, 'presetMap', 'presetFunctionMap')
}

module.exports = function createBabelConfig({ targets, options, mode, modules, presets = [], plugins = [] }) {
  if (options) {
    presets = getPresetsForOptions(options, mode).concat(presets);
    plugins = getPluginsForOptions(options, mode).concat(plugins);
  }
  if (targets) {
    presets = [
      ["@babel/preset-env", {
        "useBuiltIns": false,
        "modules": modules === true ? "commonjs" : modules,
        "targets": targets,
        "exclude": (options && options.forOfAsArray) ? ["transform-for-of"] : []
      }]
    ].concat(presets);
  }

  return {
    presets,
    plugins
  };
};