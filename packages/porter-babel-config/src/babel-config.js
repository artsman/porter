const porterBabelPluginMap = {
  decorators: ["@babel/plugin-proposal-decorators", { "legacy": true }],
  classProperties: "@babel/plugin-proposal-class-properties",
  objectRestSpread: "@babel/plugin-proposal-object-rest-spread",
  reactJsx: "@babel/plugin-transform-react-jsx",
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
  "classProperties",
  "objectRestSpread",
  "reactJsx",
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

module.exports = function createBabelConfig({ targets, options, mode, modules, presets = [], plugins = [] }) {
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
  return {
    presets,
    plugins
  };
};