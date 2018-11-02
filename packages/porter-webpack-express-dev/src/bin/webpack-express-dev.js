#!/usr/bin/env node

const loadPorterConfig = require("@porter/config");
const porterLogger = require("@porter/logger");
const startWebpackExpressServer = require('../webpack-express-dev-exec');

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);
const webpackLogger = porterLogger(porterConfig, 'webpack');
const expressLogger = porterLogger(porterConfig, 'express');

startWebpackExpressServer({ porterConfig: porterConfig, basePath, webpackLogger, expressLogger });