#!/usr/bin/env node

const rimraf = require('rimraf');
const path = require('path');

const loadPorterConfig = require("@porterjs/config");
const { porterLogger } = require("@porterjs/logger");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);
const logger = porterLogger(porterConfig, 'babel');

const { babel } = porterConfig;
const { cjsOutputPath, esOutputPath } = babel;

if (cjsOutputPath !== false) {
  logger.log('removing ' + path.join(cjsOutputPath));
  rimraf.sync(path.join(basePath, cjsOutputPath));
}
if (esOutputPath !== false) {
  logger.log('removing ' + path.join(esOutputPath));
  rimraf.sync(path.join(basePath, esOutputPath));
}
