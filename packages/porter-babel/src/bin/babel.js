#!/usr/bin/env node

const loadPorterConfig = require("@porterjs/config");
const { porterLogger } = require("@porterjs/logger");

const createBabelConfig = require("../babel-config");
const babelExec = require("../babel-exec");

const porterConfig = loadPorterConfig(process.cwd(), process.argv);

const logger = porterLogger(porterConfig, 'babel');

const mode = 'production';

const { babel } = porterConfig;
const { inputPath, cjsOutputPath, esOutputPath, targets, options, presets, plugins, sourceMaps, extensions, inlineImportExtensions } = babel;

if (cjsOutputPath !== false) {
  const cjsBabelConfig = createBabelConfig({ targets, options, mode, modules: true, presets, plugins });
  babelExec({ inputPath, outputPath: cjsOutputPath, babelConfig: cjsBabelConfig, sourceMaps, extensions, logger, description: 'in cjs mode' });
}
if (esOutputPath !== false) {
  const esBabelConfig = createBabelConfig({ targets, options, mode, modules: false, presets, plugins });
  babelExec({ inputPath, outputPath: esOutputPath, babelConfig: esBabelConfig, sourceMaps, extensions, logger, description: 'in es mode' });
}
