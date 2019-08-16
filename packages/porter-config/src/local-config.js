const path = require("path");
const fs = require("fs");

const configToString = require('./config-to-string');

function isObject(v) {
  return v !== null && v !== void 0 && typeof v === "object";
}

function mergeConfigs(baseConfig, config) {
  let mergedConfig = {};
  let allKeys = Object.keys(baseConfig);
  let keys = Object.keys(config);
  for (let key of keys) {
    if (!baseConfig.hasOwnProperty(key)) {
      allKeys.push(key);
    }
  }
  let baseValue, value;
  for (let key of allKeys) {
    baseValue = baseConfig[key];
    value = config[key];
    if (isObject(baseValue) || isObject(value)) {
      mergedConfig[key] = Object.assign({}, baseValue, value);
    }
    else {
      if (baseValue !== void 0) {
        mergedConfig[key] = baseValue;
      }
      if (value !== void 0) {
        mergedConfig[key] = value;
      }
    }
  }
  return mergedConfig;
}

module.exports = function applyLocalAndForcedPorterConfig(porterConfig, basePath, forcedConfigString, logger) {
  let mergedConfig = porterConfig;

  let { localConfigFile } = porterConfig;

  let forcedConfig = false;
  let localConfig = false;

  if (forcedConfigString) {
    try {
      forcedConfig = JSON.parse(forcedConfigString);
    }
    catch (e) {
      logger.error('failed to parse forced porter config:\n ' + e + '\n\n' + forcedConfigString);
    }
  }

  if (forcedConfig && forcedConfig.localConfigFile !== void 0) {
    logger.log('applying local porter config from forced porter config');
    localConfigFile = forcedConfig.localConfigFile;
  }
  if (localConfigFile) {
    const localConfigPath = path.resolve(basePath, localConfigFile);
    if (fs.existsSync(localConfigPath)) {
      try {
        localConfig = require(localConfigPath);
      }
      catch (e) {
        logger.error('failed to load local porter config from ' + localConfigFile + '\n', e);
      }
    }
    else {
      logger.warn('local porter config file did not exist: ' + localConfigFile);
    }
  }
  if (localConfig) {
    if (typeof localConfig === "function") {
      mergedConfig = localConfig(mergedConfig);
    }
    else {
      mergedConfig = mergeConfigs(mergedConfig, localConfig);
    }
    logger.log("applied local porter config from " + localConfigFile);
    logger.debug('local porter config:\n----\n' + configToString(localConfig) + '\n----\n');
  }
  if (forcedConfig) {
    mergedConfig = mergeConfigs(mergedConfig, forcedConfig);
    logger.log("applied forced porter config");
    logger.debug('forced porter config:\n----\n' + configToString(forcedConfig) + '\n----\n');
  }

  return mergedConfig;
};