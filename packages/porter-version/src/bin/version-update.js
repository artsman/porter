#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const { porterLogger } = require("@porterjs/logger");
const updateVersion = require("../update-version");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);

const logger = porterLogger(porterConfig, 'version');

updateVersion({ versionConfig: porterConfig.version, basePath, logger });