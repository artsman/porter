#!/usr/bin/env node

/* eslint-disable require-atomic-updates */
/* eslint-disable no-console */
/* globals require */
/* eslint-disable */

// const startWebpackExpressServer = require("@porterjs/webpack-express");
const puppeteer = require("puppeteer");
const lighthouseCore = require("lighthouse");
const reportGenerator = require("lighthouse/lighthouse-core/report/report-generator");
const fs = require("fs");
const path = require("path");

// porterConfig.webpack.defineMap.FORCED_FETCH_ALWAYS_ON = true;
// const { express } = porterConfig;
// const { port } = express;

const DEFAULT_PUPPETEER_OPTS = {
  headless: true,
  defaultViewport: null,
  ignoreHTTPSErrors: true,
  args: ["--no-sandbox"]
};

module.exports = async function runLighthouseAudits(
  porterConfig,
  basePath,
  logger,
  beforeAudits = null,
  afterAudits = null
) {
  const { lighthouse } = porterConfig;

  const { reportsPath = "./reports" } = lighthouse;

  let averageValues = {
    performance: 0,
    performanceCount: 0,
    accessibility: 0,
    accessibilityCount: 0,
    bp: 0,
    bpCount: 0,
    seo: 0,
    seoCount: 0,
    pwa: 0,
    pwaCount: 0
  };

  cleanReports(basePath, reportsPath);

  let beforeAuditsResult = null;
  if (beforeAudits) {
    beforeAuditsResult = await beforeAudits(porterConfig);
  }
  await runAllAudits(lighthouse, basePath, logger, averageValues);
  if (afterAudits) {
    await afterAudits(porterConfig, beforeAuditsResult);
  }
};

async function runAllAudits(lighthouseConfig, basePath, logger, averageValues) {
  const {
    puppeteerOpts = {},
    domainUrl,
    reportsPath = "./reports",
    pageUrls = {}
  } = lighthouseConfig;

  const pageKeys = Object.keys(pageUrls);

  const opts = Object.assign({}, DEFAULT_PUPPETEER_OPTS, puppeteerOpts);

  // Launch chrome
  const browser = await puppeteer.launch(opts);

  let finalReport = {};

  for (let pageKey of pageKeys) {
    const reportJSON = await auditPage(
      browser,
      basePath,
      reportsPath,
      domainUrl + pageUrls[pageKey],
      pageKey,
      logger
    );
    finalReport[pageKey] = JSON.parse(reportJSON);
  }

  await browser.close();

  printFinal(lighthouseConfig, basePath, finalReport, averageValues, logger);
}

async function auditPage(browser, basePath, reportsPath, url, filename, logger) {
  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 900 });
  await page.goto(url, { waitUntil: "networkidle2" });

  logger.log("\n");
  logger.log("****************************");
  logger.log("Auditing page: " + page.url());
  logger.log("****************************");
  logger.log("\n");

  const report = await lighthouseCore(url, {
    port: new URL(browser.wsEndpoint()).port,
    output: "json",
    logLevel: "info"
  });

  const html = reportGenerator.generateReport(report.lhr, "html");
  const json = reportGenerator.generateReport(report.lhr, "json");

  //Write report html to the file
  if (!fs.existsSync(path.join(basePath, reportsPath))) {
    fs.mkdirSync(path.join(basePath, reportsPath));
  }
  if (!fs.existsSync(path.join(basePath, reportsPath, "html"))) {
    fs.mkdirSync(path.join(basePath, reportsPath, "html"));
  }
  fs.writeFile(
    path.join(basePath, reportsPath, "html", filename + ".html"),
    html,
    err => {
      if (err) {
        console.error(err);
      }
    }
  );

  //Write report json to the file
  if (!fs.existsSync(path.join(basePath, reportsPath, "json"))) {
    fs.mkdirSync(path.join(basePath, reportsPath, "json"));
  }
  fs.writeFile(
    path.join(basePath, reportsPath, "json", filename + ".json"),
    json,
    err => {
      if (err) {
        console.error(err);
      }
    }
  );

  await page.close();

  return json;
}

function printFinal(lighthouseConfig, basePath, finalReport, averageValues, logger) {
  logger.log("\n************** Results **************");
  logger.log("Audit Ran With The Following Settings:");

  const { pageUrls = {}, reportsPath } = lighthouseConfig;

  const pageKeys = Object.keys(pageUrls);

  pageKeys.forEach(pageKey => {
    if (finalReport[pageKey]) {
      printAndAddCategories(
        finalReport[pageKey].categories,
        pageKey,
        averageValues,
        logger
      );
    }
  });

  logger.log("\n************** Total **************");
  logger.log(
    "Performance:                   " +
      (averageValues.performance / averageValues.performanceCount).toFixed(3)
  );
  logger.log(
    "Accessibility:                 " +
      (averageValues.accessibility / averageValues.accessibilityCount).toFixed(
        3
      )
  );
  logger.log(
    "Best Practices:                " +
      (averageValues.bp / averageValues.bpCount).toFixed(3)
  );
  logger.log(
    "Search Engine Optimization:    " +
      (averageValues.seo / averageValues.seoCount).toFixed(3)
  );
  logger.log(
    "Progressive Web App:           " +
      (averageValues.pwa == 0
        ? "FAILED"
        : (averageValues.pwa / averageValues.pwaCount).toFixed(3))
  );
  logger.log("\n\n************** Note **************");
  logger.log("Detailed audit reports can be found at:");
  logger.log("\n\n           " + path.join(basePath, reportsPath, "html") + "\n\n");
  logger.log("**********************************");
}

function printAndAddCategories(report, reportname, averageValues, logger) {
  logger.log("\n************** " + reportname + " **************");
  logger.log("Performance:                   " + report.performance.score);
  logger.log("Accessibility:                 " + report.accessibility.score);
  logger.log(
    "Best Practices:                " + report["best-practices"].score
  );
  logger.log("Search Engine Optimization:    " + report.seo.score);
  logger.log(
    "Progressive Web App:           " +
      (report.pwa.score ? report.pwa.score : "FAILED")
  );

  averageValues.performance += report.performance.score;
  averageValues.performanceCount++;
  averageValues.accessibility += report.accessibility.score;
  averageValues.accessibilityCount++;
  averageValues.bp += report["best-practices"].score;
  averageValues.bpCount++;
  averageValues.seo += report.seo.score;
  averageValues.seoCount++;
  averageValues.pwa += report.pwa.score ? report.pwa.score : 0;
  averageValues.pwaCount++;
}

function cleanReports(basePath, reportsPath) {
  fs.readdir(path.join(basePath, reportsPath, "html"), (err, files) => {
    if (err) {
      return;
    }

    for (const file of files) {
      fs.unlink(path.join(basePath, reportsPath, "html", file), _err => {});
    }
  });

  fs.readdir(path.join(basePath, reportsPath, "json"), (err, files) => {
    if (err) return;

    for (const file of files) {
      fs.unlink(path.join(basePath, reportsPath, "json", file), _err => {});
    }
  });
}
