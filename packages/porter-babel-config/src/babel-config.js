const porterBabelPluginMap = {
  decorators: ["@babel/plugin-proposal-decorators", { "legacy": true }],
  classProperties: "@babel/plugin-proposal-class-properties",
  objectRestSpread: "@babel/plugin-proposal-object-rest-spread",
  reactJsx: "@babel/plugin-transform-react-jsx",
  forOfAsArray: "babel-plugin-transform-for-of-as-array"
};

const porterBabelPluginProductionMap = {
  reactRemovePropTypes: "babel-plugin-transform-react-remove-prop-types"
};

const porterBabelPluginFunctionMap = {};

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

const porterBabelPluginList = [
  "decorators",
  "classProperties",
  "objectRestSpread",
  "reactJsx",
  "forOfAsArray",
  "reactRemovePropTypes",
  "transformImportsMap"
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
      else if (mode === "production") {
        if (porterBabelPluginProductionMap[plugin]) {
          plugins.push(porterBabelPluginProductionMap[plugin]);
        }
        else if (porterBabelPluginProductionFunctionMap[plugin]) {
          plugins.push(porterBabelPluginProductionFunctionMap[plugin](options[plugin]));
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
        "targets": targets
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