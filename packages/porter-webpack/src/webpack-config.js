const fs = require('fs');
const path = require('path');
const Webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackDeployAssetsPlugin = require('html-webpack-deploy-assets-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SentryPlugin = require('webpack-sentry-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');

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

  const { babel, webpack } = porterConfig;
  const { targets, options } = babel;

  const babelConfig = createBabelConfig({ targets, options, mode, modules: false });

  const {
    srcPaths, css, sass, html, polyfills, entry: mainEntry, split, vendor, splitVendor,
    outputPath, publicPath, bundleName, globalPackageMap, babelCacheDirectory,
    defineMap, noParse, noopRegexps,
    deployAssetMap, deployPackageAssetMap, deployPackagePath, localPackageAssetMap,
    resolveMap, resolvePackagePath, localResolveMap, localResolvePackagePath,
    minify, hotModuleReplacement, reactHotLoader,
    reportFilename, sentry, sentryUpload, serviceWorker
  } = webpack;

  const bundleNameJS = bundleName + '.js';
  const bundleNameCSS = bundleName + '.css';
  const resolveEnabled = resolveMap || (isDev && localResolveMap);
  const localAssetEnabled = isDev && localPackageAssetMap && deployPackageAssetMap;

  let resolve, resolveLoader;
  let typeToLocalPathsMaps = {}, aliasToLocalPathMap = {}, aliasToJSPathMap = {}, aliasToPorterConfigMap = {};

  if (resolveEnabled) {
    function applyPaths(packageResolveMap, packagePath, description, exitOnError = false) {
      let stats, foundPath, foundFile, foundConfig, allFound = true, typeToLocal;
      for (let type of Object.keys(packageResolveMap)) {
        typeToLocal = typeToLocalPathsMaps[type];
        if (!typeToLocal) {
          typeToLocalPathsMaps[type] = typeToLocal = [];
        }
        for (let alias of Object.keys(packageResolveMap[type])) {
          const resolveObject = packageResolveMap[type][alias];
          const { rootPath, srcPath, entryFile, configFile } = (typeof resolveObject === 'string' ? { entryFile: resolveObject } : resolveObject);
          const localPath = (rootPath !== void 0 || srcPath !== void 0) ? path.join(rootPath || '', srcPath || '') : path.join(entryFile, '../');
          const localFile = (rootPath !== void 0 || srcPath !== void 0) ? path.join(localPath, entryFile) : entryFile;
          const localConfig = (type === 'js' && configFile !== undefined) ? path.join(rootPath || '', configFile) : null;
          try {
            foundPath = path.resolve(packagePath, localPath);
            foundFile = path.resolve(packagePath, localFile);
            foundConfig = localConfig !== null ? path.resolve(packagePath, localConfig) : null;
            if (foundConfig !== null) {
              stats = fs.statSync(foundConfig);
              if (stats.isFile()) {
                aliasToPorterConfigMap[alias] = foundConfig;
                logger.log(description + ' - resource porter config found: ', type, alias, foundConfig);
              }
              else {
                logger.warn(description + ' - resource porter config was not a file: ', type, alias, localConfig);
                allFound = false;
              }
            }
            stats = fs.statSync(foundFile);
            if (stats.isDirectory() || stats.isFile()) {
              aliasToLocalPathMap[alias] = foundFile;
              typeToLocal.push(foundPath);
              if (type === 'js') {
                aliasToJSPathMap[alias] = foundPath;
              }
              logger.log(description + ' - resource found: ', type, alias, foundFile);
            }
            else {
              logger.warn(description + ' - resource was not a file or directory: ', type, alias, localFile);
              allFound = false;
            }
          }
          catch (error) {
            logger.warn(description + ' - error loading resource: ', type, alias, localFile);
            allFound = false;
          }
        }
      }
      if (!allFound) {
        logger.warn(description + ' - package path for the above errors was: ', packagePath);
        if (exitOnError) {
          process.exit(1);
        }
      }
    }

    let modulePackages = ['node_modules'];

    if (resolveMap) {
      const packagePath = path.join(basePath, resolvePackagePath || 'node_modules');
      applyPaths(resolveMap, packagePath, 'Resolve Map', true);
      if (modulePackages.indexOf(packagePath) === -1) {
        modulePackages.push(packagePath);
      }
    }
    if (isDev && localResolveMap) {
      const packagePath = path.join(basePath, localResolvePackagePath || 'node_modules');
      applyPaths(localResolveMap, packagePath, 'Local Resolve Map');
      if (modulePackages.indexOf(packagePath) === -1) {
        modulePackages.push(packagePath);
      }
    }

    resolve = {
      'modules': modulePackages,
      'alias': aliasToLocalPathMap,
      //'symlinks': false
    };
    resolveLoader = {
      'modules': modulePackages
    }
  }

  let loaderSrcPaths = (Array.isArray(srcPaths) ? srcPaths : [srcPaths]).map(srcPath => path.resolve(basePath, srcPath));

  cssPaths = css ? srcPaths : false;
  let loaderCssPaths = css ? loaderSrcPaths : null;
  let resolvedLoaderCssPaths = null;
  if (resolveEnabled && typeToLocalPathsMaps['css'] !== undefined) {
    resolvedLoaderCssPaths = typeToLocalPathsMaps['css'];
  }

  sassPaths = sass ? srcPaths : false;
  let loaderSassPaths = sass ? loaderSrcPaths : null;
  let resolvedLoaderSassPaths = null;
  if (resolveEnabled && typeToLocalPathsMaps['sass'] !== undefined) {
    resolvedLoaderSassPaths = typeToLocalPathsMaps['sass'];
  }

  if (loaderSassPaths || resolvedLoaderSassPaths) {
    if (!isSassInstalled()) {
      logger.error('Sass needs to be installed to process scss files!');
      process.exit(1);
    }
  }

  let devtool = isDev ? 'cheap-module-source-map' : 'source-map';
  let entryValues = [];
  if (polyfills) {
    if (polyfills.babel) {
      entryValues.push('@babel/polyfill');
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
    if (reactHotLoader) {
      entryValues.push('react-hot-loader/patch');
    }
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
    filename: bundleNameJS,
    chunkFilename: bundleNameJS,
    publicPath: publicPath
  };

  let plugins = [];
  if (globalPackageMap) {
    plugins.push(
      new Webpack.ProvidePlugin(globalPackageMap));
  }

  let optimization = (isDev || !minify) ? {} : {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
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
        filename: bundleNameCSS,
        chunkFilename: bundleNameCSS
      })
    );
  }

  if (html) {
    plugins.push(
      new HtmlWebpackPlugin({
        filename: html.indexFilename,
        template: html.templatePath,
        inject: false,
        chunksSortMode: 'none'
      })
    );
  }

  if (localAssetEnabled) {
    const localDeployPackageAssetMap = Object.keys(deployPackageAssetMap).reduce((m, package) => {
      if (localPackageAssetMap[package]) {
        const deployPackage = deployPackageAssetMap[package];
        const deployAssets = deployPackage.assets;
        const localAssetsMap = localPackageAssetMap[package];
        const localPackage = {
          entries: deployPackage.entries,
          assets: Object.keys(deployAssets).reduce((m, asset) => {
            if (localAssetsMap[asset]) {
              m[localAssetsMap[asset]] = deployAssets[asset];
            }
            else {
              m[asset] = deployAssets[asset];
            }
            return m;
          }, {})
        };
        m[package] = localPackage;
      }
      else {
        m[package] = deployPackageAssetMap[package];
      }
      return m;
    }, {});
    plugins.push(new HtmlWebpackDeployAssetsPlugin({
      packagePath: deployPackagePath,
      assets: deployAssetMap,
      packages: localDeployPackageAssetMap
    }));
  }
  else if (deployAssetMap || deployPackageAssetMap) {
    plugins.push(new HtmlWebpackDeployAssetsPlugin({
      packagePath: deployPackagePath,
      assets: deployAssetMap,
      packages: deployPackageAssetMap
    }));
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
    plugins.push(
      new SentryPlugin(sentry)
    );
  }

  if (serviceWorker) {
    const {
      inputPath,
      publicPath: swPublicPath = publicPath,
      filename = 'sw.js',
      excludes = ['**/.*', '**/*.map', '**/*.hot-update.json'],
      includes = []
    } = serviceWorker;
    // console.log('sw?! ', path.join(basePath, inputPath));
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

          // console.log('old assets: ' + JSON.stringify(assets, null, '\n'));
          // console.log('new assets: ' + JSON.stringify(newAssets, null, '\n'));

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
  rules.push(
    {
      test: /\.js$/,
      loader: 'babel-loader',
      query: {
        cacheDirectory: babelCacheDirectory,
        babelrc: false,
        presets: babelConfig.presets,
        plugins: babelConfig.plugins
      },
      include: loaderSrcPaths
    }
  );

  const resolvedAliases = Object.keys(aliasToJSPathMap);
  for (let resolvedAlias of resolvedAliases) {
    let resolvedLoaderSrcPath = aliasToJSPathMap[resolvedAlias];
    let resolvedPorterConfigPath = aliasToPorterConfigMap[resolvedAlias];
    if (resolvedPorterConfigPath !== undefined) {
      const localPorterConfig = require(resolvedPorterConfigPath);
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
          include: resolvedLoaderSrcPath
        }
      );
    }
    else {
      rules.push(
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            babelrcRoots: resolvedLoaderSrcPath,
            cacheDirectory: babelCacheDirectory
          },
          include: resolvedLoaderSrcPath
        }
      );
    }
  }
  if (loaderCssPaths || loaderSassPaths || resolvedLoaderCssPaths || resolvedLoaderSassPaths) {
    const cssPaths = (loaderCssPaths || []).concat(resolvedLoaderCssPaths || []);
    if (cssPaths.length > 0) {
      rules.push(
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader"
          ],
          include: cssPaths
        }
      );
    }
    const sassPaths = (loaderSassPaths || []).concat(resolvedLoaderSassPaths || []);
    if (sassPaths.length > 0) {
      rules.push(
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            "raw-loader",
            "sass-loader"
          ],
          include: sassPaths
        }
      );
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
  if (resolveEnabled) {
    config = Object.assign({}, config, {
      resolve,
      resolveLoader
    });
  }
  return config;
};
