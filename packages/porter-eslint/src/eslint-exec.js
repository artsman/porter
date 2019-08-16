const path = require('path');

const { CLIEngine } = require('eslint/lib/cli-engine');
const options = require('eslint/lib/options');

module.exports = function eslintExec({ config, logger, fix = false }) {
  const { files, ...otherConfig } = config;

  let currentOptions;

  try {
    currentOptions = {
      ...options.parse([]),
      fix,
      configFile: path.join(__dirname, 'eslint-config.js')
    };
  } catch (error) {
    logger.error(error.message);
    process.exit(2);
  }

  const engine = new CLIEngine(currentOptions);
  const report = engine.executeOnFiles(files);

  if (fix) {
    logger.log("Fix mode enabled - applying fixes");
    CLIEngine.outputFixes(report);
  }

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
    logger.log(output);
  }

  return true;

}
