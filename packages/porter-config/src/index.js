const path = require("path");

const porterLogger = require("@porter/logger");

const applyLocalAndForcedPorterConfig = require('./local-config');
const configToString = require('./config-to-string');

module.exports = function loadPorterConfig(basePath, args) {
  let basePorterConfig;
  let porterConfig;
  let hasConfigArg = false;
  let forcedConfig;
  let hasForcedArg = false;
  let configFile = './porter';
  let forceLog = false;
  let logLines = [];

  args.slice(2).forEach(function (arg) {
    if (hasConfigArg) {
      configFile = arg;
      hasConfigArg = false;
    }
    else if (hasForcedArg) {
      forcedConfig = arg;
      hasForcedArg = false;
    }
    else if (arg === '--config' || arg === '-C') {
      hasConfigArg = true;
    }
    else if (arg === '--force' || arg === '-F') {
      hasForcedArg = true;
    }
    else if (arg === '--log' || arg === '-L') {
      forceLog = true;
    }
  });

  try {
    let porterConfigFile = require.resolve(path.join(basePath, configFile));
    basePorterConfig = porterConfig = require(porterConfigFile);
  }
  catch (e) {
    console.error('failed to load porter config from ' + configFile + '\n', e);
    porterConfig = null;
  }
  let logger = null;
  if (porterConfig) {
    logLines.push('loaded porter config from ' + configFile + '\n----\n' + configToString(porterConfig) + '\n----\n');
    porterConfig.forceLog = forceLog;
    logger = porterLogger(porterConfig);
    try {
      porterConfig = applyLocalAndForcedPorterConfig(porterConfig, basePath, forcedConfig, logLines);
    }
    catch (e) {
      console.error('error applying local and forced porter config: \n', e);
      porterConfig = null;
    }
  }
  if (porterConfig) {
    logger = porterLogger(porterConfig);
    if (basePorterConfig !== porterConfig) {
      logLines.push('using porter config ' + '\n----\n' + configToString(porterConfig) + '\n----\n');
    }
  }
  if (logger) {
    for (let logLine of logLines) {
      logger.log(logLine);
    }
  }
  else {
    process.exit(1);
  }
  return porterConfig;
}
