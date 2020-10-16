#!/usr/bin/env node

const rimraf = require('rimraf');
const path = require('path');
const fs = require('fs');

const loadPorterConfig = require("@porterjs/config");
const { porterLogger } = require("@porterjs/logger");

const basePath = process.cwd();

const porterConfig = loadPorterConfig(basePath, process.argv);
const logger = porterLogger(porterConfig, 'webpack');

const { webpack } = porterConfig;
const { outputPath, html, reportFilename, deployAssetMap } = webpack;

function maybeRimrafSync(relativePath) {
  const fullPath = path.join(basePath, relativePath);
  if (fs.existsSync(fullPath)) {
    logger.log('removing ' + relativePath);
    rimraf.sync(fullPath);
  }
}

if (outputPath !== false) {
  maybeRimrafSync(outputPath);

  if (html) {
    const { indexFilename, filename = indexFilename } = html;
    maybeRimrafSync(path.join(outputPath, filename));
  }

  if (reportFilename) {
    maybeRimrafSync(path.join(outputPath, reportFilename));
  }

  if (deployAssetMap) {
    const assets = Object.keys(deployAssetMap);
    for (let asset of assets) {
      maybeRimrafSync(path.join(outputPath, deployAssetMap[asset]));
    }
  }
}
