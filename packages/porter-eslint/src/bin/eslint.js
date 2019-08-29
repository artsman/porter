#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const { porterLogger } = require("@porterjs/logger");

const eslintExec = require("../eslint-exec");

const porterConfig = loadPorterConfig(process.cwd(), process.argv);
const { eslint, extraArgs } = porterConfig;

const logger = porterLogger(porterConfig, 'eslint');

const config = extraArgs && extraArgs.length ? {...eslint, files: extraArgs } : eslint;

eslintExec({ config, logger });