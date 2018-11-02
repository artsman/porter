const path = require('path');
const express = require('express');
const expressNunjucks = require('express-nunjucks');
const { startExpressServer } = require('@porter/express');
const { createWebpackConfig, webpackExec } = require('@porter/webpack');

module.exports = function startWebpackExpressServer({ porterConfig, basePath, webpackLogger = console, expressLogger = console }) {
  const webpackConfig = createWebpackConfig({ porterConfig, basePath, isDev: false });
  const { express: expressConfig, webpack } = porterConfig;

  function addMiddleware(app) {
    app.use(webpackConfig.output.publicPath, express.static(webpackConfig.output.path));
    app.use(webpackConfig.output.publicPath, function (req, res) {
      res.status(404).send('File Not Found');
    });
    if (webpack.html) {
      const indexPath = path.resolve(basePath, webpackConfig.output.path, webpack.html.indexFilename);
      const { templateObject } = expressConfig;
      if (templateObject) {
        app.set('views', path.dirname(indexPath));
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
        app.use(function (req, res, next) {
          res.render('index', templateContent);
        });
      }
      else {
        app.use(function (req, res, next) {
          res.sendFile(indexPath);
        });
      }
    }
  }
  function callback() {
    startExpressServer({ expressConfig, basePath, logger: expressLogger, mode: 'production', addMiddleware });
  }
  webpackExec({ webpackConfig, logger: webpackLogger, callback });
}