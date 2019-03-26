const path = require('path');
const express = require('express');
const expressNunjucks = require('express-nunjucks');
const { startExpressServer } = require('@porterjs/express');
const { createWebpackConfig, webpackExec } = require('@porterjs/webpack');

module.exports = function startWebpackExpressServer({ porterConfig, basePath, webpackLogger = console, expressLogger = console }) {
  const webpackConfig = createWebpackConfig({ porterConfig, basePath, isDev: false });
  const { express: expressConfig, webpack } = porterConfig;
  const { publicPath, reroutes } = webpack;

  function addMiddleware(app) {
    const staticMiddleware = express.static(webpackConfig.output.path);

    if (reroutes) {
      for (let reroute of Object.keys(reroutes)) {
        app.use(reroute, function (req, res, next) {
          req.url = reroutes[reroute];
          staticMiddleware(req, res, next);
        });
      }
    }
    app.use(publicPath, staticMiddleware);
    app.use(publicPath, function (req, res) {
      res.status(404).send('File Not Found');
    });
    if (webpack.html) {
      const indexFilePath = path.resolve(basePath, webpackConfig.output.path, webpack.html.indexFilename);
      const { indexPath = '/', templateObject } = expressConfig;
      if (templateObject) {
        app.set('views', path.dirname(indexFilePath));
        expressNunjucks(app, {
          watch: false,
          noCache: false,
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

        app.use(indexPath, function (req, res, next) {
          res.render('index', templateContent);
        });
      }
      else {
        app.use(indexPath, function (req, res, next) {
          res.sendFile(indexFilePath);
        });
      }
    }
  }
  function callback() {
    startExpressServer({ expressConfig, basePath, logger: expressLogger, mode: 'production', addMiddleware });
  }
  webpackExec({ webpackConfig, logger: webpackLogger, callback });
}