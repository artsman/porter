const loadPorterConfig = require("@porterjs/config");

const porterConfig = loadPorterConfig(process.cwd(), process.argv);
const { eslint } = porterConfig;

const { files, ...otherConfig } = eslint;

module.exports = otherConfig;