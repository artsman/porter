const porterBabelPluginMap = {
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
};

const porterBabelPluginFunctionMap = {};

const porterBabelPluginDevelopmentMap = {
  reactHotLoader: "react-hot-loader/babel"
};

const porterBabelPluginDevelopmentFunctionMap = {};

const porterBabelPluginProductionMap = {
  reactRemovePropTypes: "babel-plugin-transform-react-remove-prop-types"
};

const inlineImportsPlugin = "babel-plugin-inline-import";

const getInlineImportsPlugin = inlineExtensions =>[inlineImportsPlugin, {
  "extensions": [
    inlineExtensions
  ]
}];

const porterBabelPluginProductionFunctionMap = {
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
};

const porterBabelPluginTestMap = {
  rewire: "babel-plugin-rewire"
};

const porterBabelPluginTestFunctionMap = {};

const porterBabelPluginList = [
  "decorators",
  "exportDefaultFrom",
  "classProperties",
  "privateMethods",
  "nullishCoalescing",
  "objectRestSpread",
  "optionalChaining",
  "reactJsx",
  "reactDisplayName",
  "forOfAsArray",
  "reactRemovePropTypes",
  "transformImportsMap",
  "rewire"
];

function getPluginsForOptions(options, mode) {
  const plugins = [];
  for (let plugin of porterBabelPluginList) {
    if (options[plugin] !== false) {
      if (porterBabelPluginMap[plugin]) {
        plugins.push(porterBabelPluginMap[plugin]);
      }
      else if (porterBabelPluginFunctionMap[plugin]) {
        plugins.push(porterBabelPluginFunctionMap[plugin](options[plugin]));
      }
      else if (mode === "development") {
        if (porterBabelPluginDevelopmentMap[plugin]) {
          plugins.push(porterBabelPluginDevelopmentMap[plugin]);
        }
        else if (porterBabelPluginDevelopmentFunctionMap[plugin]) {
          plugins.push(porterBabelPluginDevelopmentFunctionMap[plugin](options[plugin]));
        }
      }
      else if (mode === "production") {
        if (porterBabelPluginProductionMap[plugin]) {
          plugins.push(porterBabelPluginProductionMap[plugin]);
        }
        else if (porterBabelPluginProductionFunctionMap[plugin]) {
          plugins.push(porterBabelPluginProductionFunctionMap[plugin](options[plugin]));
        }
      }
      else if (mode === "test") {
        if (porterBabelPluginTestMap[plugin]) {
          plugins.push(porterBabelPluginTestMap[plugin]);
        }
        else if (porterBabelPluginTestFunctionMap[plugin]) {
          plugins.push(porterBabelPluginTestFunctionMap[plugin](options[plugin]));
        }
      }
    }
  }
  return plugins;
}

module.exports = function createBabelConfig({ targets, options, mode, modules, presets = [], plugins = [], inlineImportExtensions }) {
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
  if (options) {
    plugins = getPluginsForOptions(options, mode).concat(plugins);
  }
  if (inlineImportExtensions) {
    plugins = plugins.concat(getInlineImportsPlugin(inlineImportExtensions))
  }
  return {
    presets,
    plugins
  };
};