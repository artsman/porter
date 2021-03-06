const path = require('path');
const replace = require('@rollup/plugin-replace');
const rollupBabel = require('@rollup/plugin-babel').babel;
const node = require('@rollup/plugin-node-resolve').nodeResolve;
const commonjs = require('@rollup/plugin-commonjs');
const license = require('rollup-plugin-license');
const terser = require('rollup-plugin-terser').terser;
const rollupAnalyzer = require('rollup-plugin-analyzer').plugin;
const rollupSvelte = require('rollup-plugin-svelte');
const rollupEslint = require('rollup-plugin-eslint').eslint;

const createBabelConfig = require('./babel-config');

module.exports = function createRollupConfig({ porterConfig, basePath, minify = true, analyze = true, logger }) {
  const { babel, rollup } = porterConfig;
  const { targets, options, presets, plugins } = babel;
  const babelConfig = createBabelConfig({ targets, options, mode: 'production', modules: false, presets, plugins });
  const { inputFile, umdOutputFile, minOutputFile, name, licenseFile, globalPackages, externalPackages, svelte, svelteCssFile, sourceMap = true, useEslint = false } = rollup;
  const outputFile = minify ? minOutputFile : umdOutputFile;

  let config = {
    input: inputFile,
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      ...(useEslint ? [rollupEslint({
        configFile: path.join(__dirname, 'rollup-eslint-config.js'),
        throwOnError: true
      })] : []),
      ...(svelte ? [rollupSvelte({
        extensions: ['.svelte'],
        include: '**/*.svelte',
        ...(svelteCssFile ? {
          emitCss: true,
          css: function (css) {
            css.write(svelteCssFile);
          }
        } : {})
      })] : []),
      rollupBabel({
        exclude: 'node_modules/**',
        presets: babelConfig.presets,
        plugins: babelConfig.plugins,
        babelHelpers: 'bundled'
      }),
      node(),
      commonjs()
    ],
    external: externalPackages,
    output: {
      name: name,
      format: 'umd',
      file: outputFile,
      sourcemap: sourceMap,
      globals: globalPackages
    },
  };

  if (minify) {
    let terserOptions = {
      compress: {
        negate_iife: false
      }
    };
    config.plugins.push(terser(terserOptions));
  }
  if (licenseFile) {
    config.plugins.push(
      license({
        sourcemap: sourceMap,
        banner: {
          content: {
            file: path.join(basePath, licenseFile),
            encoding: 'utf-8', // Default is utf-8
          }
        }
      })
    );
  }

  if (analyze) {
    config.plugins.push(
      rollupAnalyzer({
        limit: 10,
        writeTo: function (analysisString) {
          logger.log(analysisString);
        }
        //filter: [],
        //root: __dirname
      })
    );
  }

  return config;
}