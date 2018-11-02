const path = require('path');
const replaceInFile = require('replace-in-file');

module.exports = function updateVersion({ versionConfig, basePath, logger }) {
  const { versionFile, from, to } = versionConfig;

  const pkg = require(path.join(basePath, 'package'));
  const { version } = pkg;
  const replacement = to.replace(/(\${version})/g, version);

  replaceInFile({
    files: path.join(basePath, versionFile),
    from,
    to: (match) => {
      if (match !== replacement) {
        logger.log('version updated from: { ' + match + ' } to: { ' + replacement + ' }');
      }
      else {
        logger.log('version not updated (no change)');
      }
      return replacement;
    }
  });
}