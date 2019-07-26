const eslintCLI = require('eslint/lib/cli');
const { CLIEngine } = require('eslint/lib/cli-engine');
const options = require('eslint/lib/options');

module.exports = function eslintExec({ config, logger }) {
  const { files, ...otherConfig } = config;

  // eslintCLI.execute(files);

  let currentOptions;

  try {
    currentOptions = { ...options.parse([]), ...otherConfig };
  } catch (error) {
    logger.error(error.message);
    process.exit(2);
  }

  const engine = new CLIEngine(currentOptions);
  const report = engine.executeOnFiles(files);

  if (printResults(engine, report.results, currentOptions.format, logger)) {
    const tooManyWarnings = currentOptions.maxWarnings >= 0 && report.warningCount > currentOptions.maxWarnings;

    if (!report.errorCount && tooManyWarnings) {
      log.error("ESLint found too many warnings (maximum: %s).", currentOptions.maxWarnings);
    }

    process.exit( (report.errorCount || tooManyWarnings) ? 1 : 0);
  }
  process.exit(2);
}

function printResults(engine, results, format, logger) {
  let formatter;
  let rulesMeta;

  try {
    formatter = engine.getFormatter(format);
  } catch (e) {
    logger.error(e.message);
    return false;
  }

  const output = formatter(results, {
    get rulesMeta() {
      if (!rulesMeta) {
        rulesMeta = {};
        for (const [ruleId, rule] of engine.getRules()) {
          rulesMeta[ruleId] = rule.meta;
        }
      }
      return rulesMeta;
    }
  });

  if (output) {
    logger.info(output);
  }

  return true;

}
