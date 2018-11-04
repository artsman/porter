const path = require('path');
const Webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const nunjucks = require('nunjucks');
const expressNunjucks = require('express-nunjucks');
const { startExpressServer } = require('@porterjs/express');
const { createWebpackConfig } = require('@porterjs/webpack');

module.exports = function startWebpackExpressDevServer({ porterConfig, basePath, webpackLogger = console, expressLogger = console }) {
  const webpackConfig = createWebpackConfig({ porterConfig, basePath, isDev: true });
  const { express: expressConfig, webpack } = porterConfig;

  function addMiddleware(app) {
    let compiler = Webpack(webpackConfig);
    const loggerLogWrapper = (...args) => webpackLogger.log(...args);
    const loggerWarnWrapper = (...args) => webpackLogger.warn(...args);
    const loggerErrorWrapper = (...args) => webpackLogger.error(...args);
    let middleware = webpackDevMiddleware(
      compiler,
      {
        stats: 'errors-only',
        noInfo: true,
        publicPath: webpackConfig.output.publicPath,
        index: webpack.html ? webpack.html.indexFilename : false,
        logger: {
          trace: loggerLogWrapper,
          debug: loggerLogWrapper,
          info: loggerLogWrapper,
          warn: loggerWarnWrapper,
          error: loggerErrorWrapper
        }
      }
    );
    app.use(middleware);
    if (webpack.hotModuleReplacement) {
      app.use(webpackHotMiddleware(compiler));
    }

    if (webpack.html) {
      const { templateObject } = expressConfig;
      if (templateObject) {
        const indexPath = path.resolve(basePath, webpackConfig.output.path, webpack.html.indexFilename);
        let nunjucksEnv = new nunjucks.Environment([], { autoescape: false });
        app.set('views', path.dirname(indexPath));
        expressNunjucks(app, {
          watch: true,
          noCache: true,
          autoescape: false
        });

        let templateContent = {};
        for (let key of Object.keys(templateObject)) {
          let value = templateObject[key];
          if (value !== null && value !== undefined && typeof value === 'object') {
            templateContent[key] = JSON.stringify(value)
          }
          else {
            templateContent[key] = value;
          }
        }
        app.use(function (req, res, next) {
          middleware.waitUntilValid(function () {
            let memoryFs = compiler.outputFileSystem;
            let indexFile = memoryFs.readFileSync(indexPath, 'utf8');
            let renderString = nunjucksEnv.renderString(indexFile, templateContent);
            res.send(renderString);
          });
        });
      }
      else {
        app.use(function (req, res, next) {
          req.url = publicPath;
          return middleware(req, res, next);
        });
      }
    }
  }
  startExpressServer({ expressConfig, basePath, logger: expressLogger, mode: 'development', addMiddleware });
}