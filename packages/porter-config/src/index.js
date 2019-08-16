const path = require("path");

const { porterLogger, memoryLogger } = require("@porterjs/logger");

const applyLocalAndForcedPorterConfig = require('./local-config');
const configToString = require('./config-to-string');

module.exports = function loadPorterConfig(basePath, args) {
  let basePorterConfig;
  let porterConfig;
  let hasConfigArg = false;
  let forcedConfig;
  let hasForcedArg = false;
  let configFile = './porter';
  let silent = false;

  let logger = porterLogger({ silent }, 'config');

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
    else if (arg === '--silent' || arg === '-S') {
      silent = true;
    }
  });

  try {
    let porterConfigFile = require.resolve(path.join(basePath, configFile));
    basePorterConfig = porterConfig = require(porterConfigFile);
  }
  catch (e) {
    logger.error('failed to load porter config from ' + configFile + '\n', e);
    porterConfig = null;
  }
  const localLogger = memoryLogger();
  if (porterConfig) {
    if (silent) {
      porterConfig.silent = silent;
    }
    logger = porterLogger(porterConfig, "config");
    logger.log('loaded porter config from ' + configFile);
    logger.debug('loaded porter config:\n----\n' + configToString(porterConfig) + '\n----\n');
    try {
      porterConfig = applyLocalAndForcedPorterConfig(porterConfig, basePath, forcedConfig, localLogger);
    }
    catch (e) {
      logger.error('error applying local and forced porter config: \n', e);
      porterConfig = null;
    }
  }
  if (porterConfig) {
    logger = porterLogger(porterConfig, 'config', true);
    localLogger.logTo(logger);
    if (basePorterConfig !== porterConfig) {
      logger.debug('using porter config ' + '\n----\n' + configToString(porterConfig) + '\n----\n');
    }
  }
  else {
    process.exit(1);
  }
  return porterConfig;
}
