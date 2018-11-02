#!/usr/bin/env node

const rimraf = require('rimraf');
const path = require('path');

const loadPorterConfig = require("@porter/config");
const porterLogger = require("@porter/logger");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);
const logger = porterLogger(porterConfig, 'rollup');

const { rollup } = porterConfig;
const { umdOutputFile, minOutputFile } = rollup;

if (umdOutputFile !== false) {
  logger.log('removing ' + path.join(umdOutputFile));
  rimraf.sync(path.join(basePath, umdOutputFile));
  rimraf.sync(path.join(basePath, umdOutputFile + '.map'));
}
if (minOutputFile !== false) {
  logger.log('removing ' + path.join(minOutputFile));
  rimraf.sync(path.join(basePath, minOutputFile));
  rimraf.sync(path.join(basePath, minOutputFile + '.map'));
}
