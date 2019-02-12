#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const porterLogger = require("@porterjs/logger");

const eslintExec = require('../eslint-exec');

const porterConfig = loadPorterConfig(process.cwd(), process.argv);

const logger = porterLogger(porterConfig, 'mocha');

const { eslint } = porterConfig;

eslintExec({ eslintConfig: eslint, logger });