#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const { porterLogger } = require("@porterjs/logger");
const runLighthouseAudits = require("../lighthouse-audits");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);

const logger = porterLogger(porterConfig, 'lighthouse');

runLighthouseAudits(porterConfig, basePath, logger);