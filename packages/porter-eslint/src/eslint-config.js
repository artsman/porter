const loadPorterConfig = require("@porterjs/config");
const createEslintConfig = require("@porterjs/eslint-config");

const porterConfig = loadPorterConfig(process.cwd(), process.argv);

const eslintConfig = createEslintConfig(porterConfig);

// eslintConfig.parserOptions.requireConfigFile = false;

module.exports = eslintConfig;