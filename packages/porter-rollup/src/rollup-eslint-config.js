const loadPorterConfig = require("@porterjs/config");
const createEslintConfig = require("@porterjs/eslint-config");

const porterConfig = loadPorterConfig(process.cwd(), process.argv);

module.exports = createEslintConfig(porterConfig);