#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const porterLogger = require("@porterjs/logger");

const eslintExec = require("../eslint-exec");

const porterConfig = loadPorterConfig(process.cwd(), process.argv);
const { eslint } = porterConfig;

const logger = porterLogger(porterConfig, 'eslint');

eslintExec({ config: eslint, logger, fix: true });