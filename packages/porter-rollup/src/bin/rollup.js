#!/usr/bin/env node

const path = require('path');
const loadPorterConfig = require("@porter/config");
const porterLogger = require('@porter/logger');

const rollupExec = require("../rollup-exec");
const createRollupConfig = require("../rollup-config");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);
const logger = porterLogger(porterConfig, 'rollup');

const { rollup } = porterConfig;

const { umdOutputFile, minOutputFile, analyze } = rollup;

if (umdOutputFile !== false) {
  const umdRollupConfig = createRollupConfig({ porterConfig, basePath, minify: false, analyze, logger });
  rollupExec({ rollupConfig: umdRollupConfig, logger });
}
if (minOutputFile !== false) {
  const minRollupConfig = createRollupConfig({ porterConfig, basePath, minify: true, analyze: analyze && umdOutputFile === false, logger });
  rollupExec({ rollupConfig: minRollupConfig, logger });
}
