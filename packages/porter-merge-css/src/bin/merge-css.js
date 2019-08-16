#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const { porterLogger } = require("@porterjs/logger");
const mergeCSS = require("../merge-css");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);

const logger = porterLogger(porterConfig, 'merge-css');

mergeCSS({ mergeCSSConfig: porterConfig.mergeCSS, basePath, logger });