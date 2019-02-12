const path = require('path');
const eslint = require('eslint');
const eslintConfig = require('eslint/lib/config/config-file');
const eslintRecommended = require('eslint/conf/eslint-recommended');
const eslintAll = require('eslint/conf/eslint-all');
const loadPorterConfig = require("@porterjs/config");
const createBabelConfig = require("@porterjs/babel-config");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);

const { babel } = porterConfig;
const { targets, options, presets, plugins } = babel;

const babelConfig = createBabelConfig({ targets, options, mode: 'test', modules: true, presets, plugins }); // mode: 'lint' ???

module.exports = function eslintExec({ eslintConfig, logger = console }) {
  const { CLIEngine } = eslint;
  const { files, format = 'stylish', ...eslintOptions } = eslintConfig;
  let rules = {};
  if (Array.isArray(eslintOptions['extends'])) {
    // for loop over extends, add .rules for each extends to the main rules map

    // are the plugins working properly?!?!

    // eslintConfig.resolve() may be useful to handle all cases like below

    if (eslintOptions['extends'] === 'eslint:recommended') {
      rules = {...rules, ...eslintRecommended.rules};
    }
    else if (eslintOptions['extends'] === 'eslint:all') {
      rules = { ...rules, ...eslintAll.rules };
    }
    delete eslintOptions['extends'];
  }
  if (eslintOptions.rules) {
    rules = {...rules, ...eslintOptions.rules};
  }

  // babelRegister({
  //   babelrc: false,
  //   presets: babelConfig.presets,
  //   plugins: babelConfig.plugins
  // });

  // const tOptions = {};
  // const files = [];
  const engine = new CLIEngine({ ...eslintOptions, useEslintrc: false, rules });
  const report = engine.executeOnFiles(files.map(file => path.join(basePath, file)));
  const formatter = engine.getFormatter(format);
  const output = formatter(report.results);
  console.log("output: " + output);
}