#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const porterLogger = require("@porterjs/logger");

const mochaExec = require('../mocha-exec');

const porterConfig = loadPorterConfig(process.cwd(), process.argv);

const logger = porterLogger(porterConfig, 'mocha');

const { mocha } = porterConfig;

mochaExec({ mochaConfig: mocha, logger });