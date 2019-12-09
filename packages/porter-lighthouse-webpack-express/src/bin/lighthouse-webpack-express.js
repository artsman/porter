#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const { porterLogger } = require("@porterjs/logger");
const runWebpackExpressLighthouseAudits = require("../lighthouse-webpack-express-audits");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);

const logger = porterLogger(porterConfig, 'lighthouse');

runWebpackExpressLighthouseAudits(porterConfig, basePath, logger);