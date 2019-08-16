const LOG_LEVELS = ['debug', 'info', 'log', 'warn', 'error'];

const NO_OP = () => {};

const NO_LOGGER = {
  debug: NO_OP,
  info: NO_OP,
  log: NO_OP,
  warn: NO_OP,
  error: NO_OP
};

const consoleLogger = logLevel => {
  const levelIndex = LOG_LEVELS.indexOf(logLevel);
  if (levelIndex === -1) {
    throw new Error('invalid log level: ' + logLevel);
  }
  const logger = {};
  LOG_LEVELS.forEach((level, i) => {
    if (i < levelIndex) {
      logger[level] = NO_OP;
    } else {
      logger[level] = (...args) => console[level](...args);
    }
  });
  return logger;
};


const memoryLogger = () => {
  const lines = [];
  const logger = {};
  LOG_LEVELS.forEach(level => {
    logger[level] = (...args) => lines.push({ level, args });
  });
  logger.logTo = (logger) => {
    lines.forEach(({ level, args }) => {
      logger[level](...args);
    });
  };
  return logger;
};

function porterLogger(porterConfig, key = false, check = false) {
  let { silent, logLevel = 'log' } = porterConfig;
  if (!silent) {
    if (key && porterConfig[key] && porterConfig[key].logLevel !== void 0) {
      logLevel = porterConfig[key].logLevel;
    }
    return consoleLogger(logLevel);
  } else {
    return NO_LOGGER;
  }
};

module.exports = {
  porterLogger,
  memoryLogger
};