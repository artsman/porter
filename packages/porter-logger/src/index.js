const logger = {
  log: function(...args) {
    console.log(...args);
  },
  info: function (...args) {
    console.info(...args);
  },
  warn: function (...args) {
    console.warn(...args);
  },
  error: function (...args) {
    console.warn(...args);
  }
}

const noLogger = {
  log: function() {},
  info: function () { },
  warn: function (...args) {
    console.warn(...args);
  },
  error: function (...args) {
    console.warn(...args);
  }
}

module.exports = function porterLogger(porterConfig, key = false) {
  let { forceLog, log = false } = porterConfig;
  if (key && porterConfig[key] && porterConfig[key].log !== void 0) {
    log = porterConfig[key].log;
  }
  if (forceLog || log) {
    return logger;
  }
  else {
    return noLogger;
  }
};