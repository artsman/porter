const fs = require('fs');
const path = require('path');
const Webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackDeployPlugin = require('html-webpack-deploy-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SentryPlugin = require('webpack-sentry-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-dev-plugin');

const createBabelConfig = require("@porterjs/babel-config");

function isPackageInstalled(package) {
  let resolved = null;
  try {
    resolved = require.resolve(package);
  } catch (e) {
    resolved = null;
  }
  return resolved !== null;
}

function isSassInstalled() {
  return isPackageInstalled('sass-loader') && isPackageInstalled('node-sass');
}

/**
 * Builds a webpack config object from the given porter config
 * @param porterConfig - The porter config to use to build the webpack config
 * @param basePath - The base path to resolve files from
 * @returns Object webpack config
 */
module.exports = function createWebpackConfig({ porterConfig, basePath, isDev = false, logger = console }) {
  const mode = isDev ? 'development' : 'production';

  const { babel, eslint, webpack } = porterConfig;
  const { targets, options } = babel;

  const {
    srcPaths, css, sass, svelte, html, htmlDeploy, polyfills, entry: mainEntry, split, vendor, splitVendor,
    outputPath, publicPath, bundleNameJS, bundleNameCSS, bundleName, globalPackageMap, babelCacheDirectory,
    defineMap, noParse, noopRegexps, useEslint,
    localPackages, sourceMap = true,
    minify, hotModuleReplacement, reactHotLoader, svelteHotReload,
    reportFilename, sentry, sentryUpload, sentryIgnoreConflict = false, serviceWorker
  } = webpack;

  const babelConfig = createBabelConfig({ targets, options: { ...options, reactHotLoader }, mode, modules: false });

  const bundleNameForJS = (bundleNameJS || bundleName) + '.js';
  const bundleNameForCSS = (bundleNameCSS || bundleName) + '.css';
  const hasLocalPackages = (isDev && localPackages);

  let resolve = {};
  let packageToSrcPathMap = {};
  let packageToConfigFileMap = {};

  if (hasLocalPackages) {
    let packageToEntryFileMap = {};

    const modulePackages = [path.join(basePath, 'node_modules'), 'node_modules'];

    function processPackages(packageMap, description, exitOnError = true) {
      let stats, foundSrcPath, foundEntryFile, foundConfigFile, allFound = true;
      for (let packageName of Object.keys(packageMap)) {
        const packageObject = packageMap[packageName];

        const { rootPath, entry, copy } = packageObject;
        if (entry !== void 0) {
          const { configFile, srcPath, entryFile } = entry;
          const localConfigFile = (configFile !== void 0) ? path.join(rootPath || '', configFile) : null;
          const localSrcPath = path.join(rootPath || '', srcPath || '');
          const localEntryFile = path.join(localSrcPath, entryFile);
          try {
            foundSrcPath = path.resolve(basePath, localSrcPath);
            foundEntryFile = path.resolve(basePath, localEntryFile);
            foundConfigFile = localConfigFile !== null ? path.resolve(basePath, localConfigFile) : null;
            if (foundConfigFile !== null) {
              stats = fs.statSync(foundConfigFile);
              if (stats.isFile()) {
                packageToConfigFileMap[packageName] = foundConfigFile;
                logger.log(description + ' - resource porter config found: ', packageName, foundConfigFile);
              }
              else {
                logger.warn(description + ' - resource porter config was not a file: ', packageName, localConfigFile);
                allFound = false;
              }
            }
            stats = fs.statSync(foundEntryFile);
            if (stats.isDirectory() || stats.isFile()) {
              packageToEntryFileMap[packageName] = foundEntryFile;
              packageToSrcPathMap[packageName] = foundSrcPath;
              logger.log(description + ' - resource found: ', packageName, foundEntryFile);
            }
            else {
              logger.warn(description + ' - resource was not a file or directory: ', packageName, localEntryFile);
              allFound = false;
            }
          }
          catch (error) {
            logger.warn(description + ' - error loading resource: ', packageName, localEntryFile);
            allFound = false;
          }

        }
        if (copy !== void 0) {

        }
      }
      if (!allFound) {
        logger.warn(description + ' - base path for the above errors was: ', basePath);
        if (exitOnError) {
          process.exit(1);
        }
      }
    }
    processPackages(localPackages, 'Local Packages Map');

    resolve = {
      modules: modulePackages,
      alias: packageToEntryFileMap,
      //symlinks: false
    };
  }

  let loaderSrcPaths = (Array.isArray(srcPaths) ? srcPaths : [srcPaths]).map(srcPath => path.resolve(basePath, srcPath));

  let loaderCssPaths = css ? loaderSrcPaths : null;

  let loaderSassPaths = sass ? loaderSrcPaths : null;

  if (loaderSassPaths) {
    if (!isSassInstalled()) {
      logger.error('Sass needs to be installed to process scss files!');
      process.exit(1);
    }
  }

  let devtool = isDev ? 'cheap-module-source-map' : 'source-map';
  let entryValues = [];
  if (polyfills) {
    if (polyfills.babel || polyfills.corejs) {
      entryValues.push("core-js/stable");
    }
    if (polyfills.babel || polyfills.regenerator) {
      entryValues.push("regenerator-runtime/runtime");
    }
    if (polyfills.fetch) {
      entryValues.push('whatwg-fetch');
    }
  }
  if (isDev && (hotModuleReplacement)) {
    if (polyfills && polyfills.eventSource) {
      entryValues.push('eventsource-polyfill');
    }
    entryValues.push('webpack-hot-middleware/client?reload=true');
  }
  if (Array.isArray(mainEntry.files)) {
    entryValues = entryValues.concat(mainEntry.files);
  }
  else {
    entryValues.push(mainEntry.files);
  }

  let entry = {
    [mainEntry.name]: entryValues
  };
  let output = {
    path: path.join(basePath, outputPath),
    filename: bundleNameForJS,
    chunkFilename: bundleNameForJS,
    publicPath: publicPath
  };
  // TODO - add webpack output library and libraryTarget support
  // if (isDev) {
  //   output.libraryTarget = 'umd';
  //   output.library = 'reveal';
  // }

  // TODO - add webpack externals support
  // let externals;
  // if (isDev) {
  //   externals = {
  //   'react': { commonjs: 'react' },
  //     'react-dom': { commonjs: 'react-dom' }
  //   };
  //   externals = {
  //     'react': 'react',
  //     'react-dom': 'react'
  //   };
  //   externals = {
  //     'react': path.join(basePath, 'node_modules', 'react'),
  //     'react-dom': path.join(basePath, 'node_modules', 'react-dom'),
  //   };
  // }

  let plugins = [];
  if (globalPackageMap) {
    plugins.push(
      new Webpack.ProvidePlugin(globalPackageMap));
  }

  let optimization = (isDev || !minify) ? {
    minimize: false
  } : {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap
        }),
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            map: { inline: false, annotations: true }
          }
        })
      ]
    };

  if (split) {
    optimization = {
      ...optimization,
      splitChunks: {
        chunks: 'all',
        minSize: split.minSize,
        minChunks: split.minChunks,
        maxAsyncRequests: split.maxAsyncRequests,
        maxInitialRequests: split.maxInitialRequests,
        cacheGroups: {
          default: false
        }
      }
    };

    let cacheGroups = optimization.splitChunks.cacheGroups;

    if (vendor) {
      cacheGroups.vendors = {
        name: vendor.name,
        minSize: vendor.minSize,
        minChunks: vendor.minChunks,
        test: vendor.resourceFilter,
        chunks: 'initial',
        reuseExistingChunk: true,
        priority: 1,
        enforce: true
      };
    }

    if (splitVendor) {
      cacheGroups.splitVendors = {
        name: splitVendor.name,
        minSize: splitVendor.minSize,
        minChunks: splitVendor.minChunks,
        test: splitVendor.resourceFilter,
        chunks: 'async',
        reuseExistingChunk: false,
        priority: 2,
        enforce: true
      };
    }
  }

  if (css || sass) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: bundleNameForCSS,
        chunkFilename: bundleNameForCSS
      })
    );
  }

  if (html) {
    const htmlOptions = {
      filename: html.indexFilename,
      template: html.templatePath
    };
    if (html.inject !== void 0) {
      htmlOptions.inject = html.inject;
    }
    if (html.chunksSortMode !== void 0) {
      htmlOptions.chunksSortMode = html.chunksSortMode;
    } else {
      htmlOptions.chunksSortMode = 'none'; // https://github.com/jantimon/html-webpack-plugin/issues/981
    }
    plugins.push(
      new HtmlWebpackPlugin(htmlOptions)
    );

    if (htmlDeploy) {
      let deployOptions = htmlDeploy;
      if (hasLocalPackages) {
        let { packages, ...otherOptions } = deployOptions;
        if (packages) {
          packages = { ...packages };
          for (let packageName of Object.keys(localPackages)) {
            let deployPackage = packages[packageName];
            if (deployPackage !== void 0) {
              deployPackage = { ...deployPackage };
              let { rootPath, copy, links, scripts } = localPackages[packageName];
              if (copy !== void 0) {
                if (Array.isArray(copy)) {
                  copy = copy.map(copyItem => ({ ...copyItem, fromAbsolute: true, from: path.join(basePath, rootPath, copyItem.from) }));
                }
                else {
                  copy = { ...copy, fromAbsolute: true, from: path.join(basePath, rootPath, copy.from) };
                }
                deployPackage.copy = copy;
              }
              const processTagGlob = tag => {
                if (typeof tag === 'object') {
                  if (tag.globPath !== void 0) {
                    return {
                      ...tag,
                      path: tag.path !== void 0 ? tag.path : '',
                      globPath: path.join(basePath, rootPath, tag.globPath)
                    };
                  }
                  else {
                    return tag;
                  }
                }
                else {
                  return tag;
                }
              }
              if (links !== void 0) {
                if (Array.isArray(links)) {
                  deployPackage.links = links.map(processTagGlob);
                }
                else {
                  deployPackage.links = processTagGlob(links);
                }
              }
              if (scripts !== void 0) {
                if (Array.isArray(scripts)) {
                  deployPackage.scripts = scripts.map(processTagGlob);
                }
                else {
                  deployPackage.scripts = processTagGlob(scripts);
                }
              }
              packages[packageName] = deployPackage;
            }
          }
          deployOptions = {
            ...otherOptions,
            packages
          };
        }
      }
      plugins.push(new HtmlWebpackDeployPlugin(deployOptions));
    }
  }

  if (defineMap) {
    plugins.push(
      new Webpack.DefinePlugin(defineMap));
  }

  if (isDev) {
    if (hotModuleReplacement) {
      plugins.push(
        new Webpack.HotModuleReplacementPlugin(),
        new Webpack.NoEmitOnErrorsPlugin()
      );
    }
  }
  else {
    plugins.push(
      new Webpack.DefinePlugin({
        'process.env': { 'NODE_ENV': JSON.stringify('production') }
      })
    );
    if (reportFilename) {
      plugins.push(
        new BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename, openAnalyzer: false })
      );
    }
  }

  if (sentryUpload && sentry) {
    const suppressConflictError = !!sentryIgnoreConflict;
    const sentryOptions = suppressConflictError ? { ...sentry, suppressConflictError } : sentry;
    plugins.push(
      new SentryPlugin(sentryOptions)
    );
  }

  if (serviceWorker) {
    const {
      inputPath,
      publicPath: swPublicPath = publicPath,
      filename = 'sw.js',
      excludes = ['**/.*', '**/*.map', '**/*.hot-update.json', '**/*.hot-update.js'],
      includes = []
    } = serviceWorker;
    const swPublicPathLength = swPublicPath.length;
    const pathReplacer = swPublicPath === publicPath ? asset => asset : asset => publicPath + asset.substring(swPublicPathLength);

    plugins.push(
      new ServiceWorkerWebpackPlugin({
        entry: path.join(basePath, inputPath),
        publicPath: swPublicPath,
        filename,
        excludes,
        includes,
        transformOptions: ({ assets }) => {
          const indexPath = html ? swPublicPath + html.indexFilename : false;
          const newAssets = assets.map(asset => {
            return asset === indexPath ? swPublicPath : pathReplacer(asset);
          });

          return {
            assets: newAssets
          }
        }
      })
    );
  }

  if (noopRegexps) {
    for (let noopRegexp of noopRegexps) {
      plugins.push(
        new Webpack.NormalModuleReplacementPlugin(
          noopRegexp,
          require.resolve('node-noop')
        )
      );
    }
  }

  let rules = [];
  if (eslint && useEslint) {
    rules.push(
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'eslint-loader',
        options: {
          configFile: path.join(__dirname, 'webpack-eslint-config.js')
        },
        include: loaderSrcPaths
      }
    );
  }
  rules.push(
    {
      test: svelte ? /\.js|\.mjs|\.svelte$/ : /\.js$/,
      loader: 'babel-loader',
      query: {
        cacheDirectory: babelCacheDirectory,
        babelrc: false,
        presets: babelConfig.presets,
        plugins: babelConfig.plugins
      },
      include: svelte ? loaderSrcPaths.concat([path.resolve('node_modules', 'svelte')]) : loaderSrcPaths
    }
  );
  if (svelte) {
    rules.push(
      {
        test: /\.svelte$/,
        loader: 'svelte-loader',
        options: {
          hotReload: !!svelteHotReload,
          emitCss: true,
        },
        include: loaderSrcPaths
      }
    );
  }

  const packageNames = Object.keys(packageToSrcPathMap);
  for (let packageName of packageNames) {
    let packageSrcPath = packageToSrcPathMap[packageName];
    let packageConfigFile = packageToConfigFileMap[packageName];
    if (packageConfigFile !== void 0) {
      const localPorterConfig = require(packageConfigFile);
      const { babel: localBabel } = localPorterConfig;
      const { targets: localTargets, options: localOptions } = localBabel;
      const localBabelConfig = createBabelConfig({ targets: localTargets, options: localOptions, mode, modules: false });
      rules.push(
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            cacheDirectory: babelCacheDirectory,
            babelrc: false,
            presets: localBabelConfig.presets,
            plugins: localBabelConfig.plugins
          },
          include: packageSrcPath
        }
      );
    }
    else {
      let query = {
        babelrcRoots: packageSrcPath,
        cacheDirectory: babelCacheDirectory
      };
      let include = packageSrcPath;

      const localPackage = localPackages[packageName];
      if (localPackage && localPackage.entry && !localPackage.entry.srcPath) {
        // This is a local resolve for a node_module package
        // The thinking was this might be useable to fix the fact that react-redux uses global state
        // The attempt was to make react-redux locally resolve to node_modules to be shared by subsequent local resolves resolving the conflicts
        // example:
        // "react-redux": {
        //   rootPath: "./node_modules/react-redux/es/index.js"
        // }
        // use the basePath + rootPath as the babel-loader include/entry path
        query = {
          babelrc: false,
          cacheDirectory: babelCacheDirectory
        };
        include = path.join(basePath, packageSrcPath);
      }
      rules.push(
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: query,
          include: include
        }
      );
    }
  }
  if (loaderCssPaths || loaderSassPaths) {
    if (loaderCssPaths && loaderCssPaths.length > 0) {
      loaderCssPaths.forEach(cssPath => {
        rules.push(
          {
            test: /\.css$/,
            use: [
              MiniCssExtractPlugin.loader,
              "css-loader"
            ],
            include: cssPath
          }
        );
      });
    }
    if (loaderSassPaths && loaderSassPaths.length > 0) {
      loaderSassPaths.forEach(sassPath => {
        rules.push(
          {
            test: /\.scss$/,
            use: [
              MiniCssExtractPlugin.loader,
              "css-loader",
              "sass-loader"
            ],
            include: sassPath
          }
        );
      });
    }
    rules.push(
      { test: /\.(png|jpg|gif)$/, loader: "file-loader" },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
      { test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?prefix=font/&limit=5000" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/svg+xml" }
    );
  }
  let module = {
    noParse,
    rules
  };
  let target = "web";

  let config = {
    mode,
    devtool,
    entry,
    output,
    optimization,
    plugins,
    module,
    target
  };
  // TODO - add webpack externals support
  // if (externals !== void 0) {
  //   config.externals = externals;
  // }
  if (isDev && reactHotLoader) {
    if (!resolve.alias) {
      resolve.alias = {};
    }
    resolve.alias['react-dom'] = '@hot-loader/react-dom';
  }
  if (svelte) {
    if (!resolve.alias) {
      resolve.alias = {};
    }
    resolve.alias['svelte'] = path.resolve('node_modules', 'svelte');
    resolve.extensions = ['.mjs', '.js', '.svelte'];
    resolve.mainFields = ['svelte', 'browser', 'module', 'main'];
  }
  if (Object.keys(resolve).length > 0) {
    config = Object.assign({}, config, { resolve });
  }
  return config;
};
