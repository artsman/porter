#!/usr/bin/env node

const loadPorterConfig = require("@porter/config");
const porterLogger = require("@porter/logger");
const createWebpackConfig = require('../webpack-config');
const webpackExec = require('../webpack-exec');

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);
const logger = porterLogger(porterConfig, 'webpack');

const webpackConfig = createWebpackConfig({ porterConfig, basePath, isDev: false });

webpackExec({ webpackConfig, logger });