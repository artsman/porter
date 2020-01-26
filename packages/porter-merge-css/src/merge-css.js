const path = require('path');
const glob = require('glob');
const mkdirpSync = require("mkdirp").sync;
const concat = require('concat');

module.exports = function mergeCSS({ mergeCSSConfig, basePath, logger }) {
  const { cssPaths, outputFile } = mergeCSSConfig;

  mkdirpSync(path.join(outputFile, '../'));

  let files = [];
  for (let cssPath of cssPaths) {
    files = files.concat(glob.sync(cssPath));
  }

  concat(files, outputFile);
  logger.log('merged ' + files.length + ' css-files into: ' + outputFile);
}