const runLighthouseAudits = require("@porterjs/lighthouse");
const startWebpackExpressServer = require("@porterjs/webpack-express");

module.exports = async function runWebpackExpressLighthouseAudits(porterConfig, basePath, logger) {
  const { lighthouse, express, configModifier } = porterConfig;

  let closeServer = null;

  if (configModifier) {
    porterConfig = configModifier(porterConfig);
  }

  function beforeAudits() {
    return new Promise((resolve, reject) => {
      const onStart = () => { resolve(closeServer); }
      try {
        closeServer = startWebpackExpressServer({ porterConfig, basePath, onStart });
      } catch (err) {
        reject(err);
      }
    });
  }

  function afterAudits() {
    // For some reason the closeServer promise does not always resolve, so for the purposes of CI just always resolve it
    // return closeServer();
    return new Promise(resolve => {
      if (closeServer) {
        closeServer();
      }
      resolve();
    });
  }

  const { domainUrl } = lighthouse;
  if (!domainUrl) {
    porterConfig = {
      ...porterConfig,
      lighthouse: {
        ...lighthouse,
        domainUrl: (express.secure ? "https://" : "http://") + "localhost:" + express.port + "/"
      }
    }
  }

  await runLighthouseAudits(porterConfig, basePath, logger, beforeAudits, afterAudits);
}
