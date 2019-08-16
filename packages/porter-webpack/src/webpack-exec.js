const webpack = require("webpack");

module.exports = function webpackExec({ webpackConfig, logger = console, callback = null }) {
  const compiler = webpack(webpackConfig);
  let lastHash = null;

  function compilerCallback(err, stats) {
    if (err) {
      // Do not keep cache anymore
      compiler.purgeInputFileSystem();
      lastHash = null;
      logger.error(err.stack || err);
      if (err.details) logger.error(err.details);
      process.exit(1);
    }
    if (stats.hash !== lastHash) {
      lastHash = stats.hash;
      logger.log(stats.toString() + "\n");
    }
    if (stats.hasErrors()) {
      process.on("exit", function () {
        process.exit(2);
      });
    }
    if (callback) {
      callback();
    }
  }
  compiler.run(compilerCallback);
}

