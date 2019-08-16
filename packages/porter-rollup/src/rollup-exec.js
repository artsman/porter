const rollup = require('rollup');
const ms = require('pretty-ms');

module.exports = function rollupExec({ rollupConfig, logger = console }) {
  const start = Date.now();

  // create a bundle
  rollup.rollup(rollupConfig).then(
    bundle => {
      // write the bundle to disk
      bundle.write(rollupConfig.output).then(
        result => {
          logger.log(`\n${rollupConfig.input} → ${rollupConfig.output.file}`);
          logger.log(`created ${rollupConfig.output.file} in ${ms(Date.now() - start)}`);
        },
        error => {
          logger.error(error);
          process.exit(1);
        }
      );
    },
    error => {
      logger.error(error);
      process.exit(1);
    }
  );
};