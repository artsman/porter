#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const porterLogger = require("@porterjs/logger");
const startWebpackExpressServer = require('../webpack-express-exec');

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);
const webpackLogger = porterLogger(porterConfig, 'webpack');
const expressLogger = porterLogger(porterConfig, 'express');

startWebpackExpressServer({ porterConfig: porterConfig, basePath, webpackLogger, expressLogger });