#!/usr/bin/env node

const loadPorterConfig = require("@porter/config");
const porterLogger = require("@porter/logger");
const updateVersion = require("../update-version");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);

const logger = porterLogger(porterConfig, 'version');

updateVersion({ versionConfig: porterConfig.version, basePath, logger });