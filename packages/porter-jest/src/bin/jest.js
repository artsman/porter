#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const { porterLogger } = require("@porterjs/logger");

const jestExec = require('../jest-exec');

const porterConfig = loadPorterConfig(process.cwd(), process.argv);

const logger = porterLogger(porterConfig, 'jest');

const { jest } = porterConfig;

jestExec({ jestConfig: jest, logger });