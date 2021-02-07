const path = require('path');
const Webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const nunjucks = require('nunjucks');
const expressNunjucks = require('express-nunjucks');
const { startExpressServer } = require('@porterjs/express');
const { createWebpackConfig } = require('@porterjs/webpack');

module.exports = function startWebpackExpressDevServer({ porterConfig, basePath, expressLogger = console, onStart }) {
  const webpackConfig = createWebpackConfig({ porterConfig, basePath, isDev: true });
  const { express: expressConfig, webpack } = porterConfig;
  const { publicPath, reroutes } = webpack;
  const { serverPath = '' } = expressConfig;


  function addMiddleware(app) {
    let compiler = Webpack(webpackConfig);
    let middleware = webpackDevMiddleware(compiler, {
      stats: "errors-only",
      // noInfo: true,
      publicPath: publicPath,
      index: webpack.html ? webpack.html.indexFilename : false
    });

    if (reroutes) {
      for (let reroute of Object.keys(reroutes)) {
        app.use(reroute, function (req, res, next) {
          // middleware.waitUntilValid(function () {
          req.url = path.join(publicPath, reroutes[reroute]);
          middleware(req, res, next);
          // });
        });
      }
    }

    if (serverPath) {
      app.use(serverPath, function (req, res, next) {
        middleware(req, res, next);
      });
    }

    app.use(middleware);
    if (webpack.hotModuleReplacement) {
      app.use(webpackHotMiddleware(compiler));
    }

    if (webpack.html) {
      const { indexPath = '/', templateObject } = expressConfig;
      if (templateObject) {
        const { filename , indexFilename } = webpack.html;
        const indexFilePath = path.resolve(basePath, webpackConfig.output.path, filename || indexFilename);
        let nunjucksEnv = new nunjucks.Environment([], { autoescape: false });
        app.set('views', path.dirname(indexFilePath));
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
        app.use(serverPath + indexPath, function (req, res, next) {
          middleware.waitUntilValid(function () {
            let memoryFs = compiler.outputFileSystem;
            let indexFile = memoryFs.readFileSync(indexFilePath, 'utf8');
            let renderString = nunjucksEnv.renderString(indexFile, templateContent);
            res.send(renderString);
          });
        });
      }
      else {
        app.use(serverPath + indexPath, function (req, res, next) {
          req.url = publicPath || '/';
          return middleware(req, res, next);
        });
      }
    }
    function closeMiddleware() {
      return new Promise((resolve, reject) => {
        try {
          middleware.close(() => resolve());
        }
        catch (error) {
          reject(error);
        }
      });
    }
    return closeMiddleware;
  }
  return startExpressServer({ expressConfig, basePath, logger: expressLogger, mode: 'development', addMiddleware });
}