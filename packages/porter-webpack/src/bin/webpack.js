#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const porterLogger = require("@porterjs/logger");
const createWebpackConfig = require('../webpack-config');
const webpackExec = require('../webpack-exec');

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);
const logger = porterLogger(porterConfig, 'webpack');

const webpackConfig = createWebpackConfig({ porterConfig, basePath, isDev: false });

webpackExec({ webpackConfig, logger });