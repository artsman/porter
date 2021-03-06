process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fs = require('fs');
const path = require('path');
const compression = require('compression');
const express = require('express');
const https = require('https');
const http = require('http');
const open = require("open");
const request = require('request');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const socketIOClient = require('socket.io-client');
const socketIOWildcard = require('socketio-wildcard');

const defaultProxyHeaderKeys = [
  'auth', 'Auth', 'authorization', 'Authorization', 'content-type', 'Content-Type', 'user-agent', 'User-Agent',
  'content-length', 'Content-Length', 'connection', 'Connection', 'accept', 'Accept',
  'accept-encoding', 'Accept-Encoding', 'accept-language', 'Accept-Language', 'cache-control', 'Cache-Control',
  'date', 'Date', 'expires', 'Expires', 'strict-transport-security', 'Strict-Transport-Security'
];

function addProxyMiddleware(app, proxyConfig) {
  const {
    proxyHost, proxyHttpPaths, proxySocketPath, proxySocketHandshakeQueryKeys,
    proxyHeaderKeysForced, proxyHeaderKeysExtra
  } = proxyConfig;
  if (proxyHttpPaths && proxyHttpPaths.length > 0) {
    app.use(bodyParser.json());

    const proxyHeaderKeys = (proxyHeaderKeysForced ? proxyHeaderKeysForced : defaultProxyHeaderKeys).concat(proxyHeaderKeysExtra ? proxyHeaderKeysExtra : []);

    function copyProxyHeaders(fromHeaders, toHeaders, proxyHeaderKeys) {
      for (let proxyHeaderKey of proxyHeaderKeys) {
        if (fromHeaders[proxyHeaderKey] !== undefined) {
          toHeaders[proxyHeaderKey] = fromHeaders[proxyHeaderKey];
        }
      }
    }

    proxyHttpPaths.forEach(proxyPath => {
      app.use(proxyPath, function (req, res) {
        var requestUrl = proxyHost + proxyPath + req.url;
        var options = {};
        var headers = {};
        options.headers = headers;
        options.method = req.method;
        if (req.headers !== undefined) {
          copyProxyHeaders(req.headers, headers, proxyHeaderKeys);
        }
        options.gzip = true;
        if (req.body !== undefined) {
          options.json = true;
          options.body = req.body;
        }

        request(requestUrl, options, function (error, response, body) {
          let responseHeaders = {};
          if (response && response.headers) {
            copyProxyHeaders(response.headers, responseHeaders, proxyHeaderKeys);
          }
          let headerKeys = Object.keys(responseHeaders);
          for (let headerKey of headerKeys) {
            res.setHeader(headerKey, responseHeaders[headerKey]);
          }

          if (!error && response.statusCode == 200) {
            res.send(body);
          }
          else {
            if (error) {
              res.status(500).send('proxy error: ' + error);
            }
            else {
              res.status(response.statusCode).send(body);
            }
          }
        })
      });
    });
  }
}

function addProxySocket(expressServer, proxyConfig, logger) {
  const {
    proxyHost, proxySocketPath, proxySocketHandshakeQueryKeys
  } = proxyConfig;
  if (proxySocketPath) {
    let proxyServerSocket = socketIO(expressServer, { path: proxySocketPath });
    proxyServerSocket.use(socketIOWildcard());
    let patch = socketIOWildcard(socketIOClient.Manager);
    let proxyClientSocket;

    function parsePacket(packet) {
      let event = undefined;
      let payload = undefined;
      if (packet && packet.data && Array.isArray(packet.data) && packet.data.length >= 2) {
        event = packet.data[0];
        payload = packet.data[1];
      }
      return {
        event,
        payload
      };
    }

    proxyServerSocket.on('connection', function (socket) {
      if (proxyClientSocket === undefined) {
        let query = {};
        if (proxySocketHandshakeQueryKeys) {
          if (socket.handshake && socket.handshake.query) {
            let handshakeQuery = socket.handshake.query;
            for (let queryKey of proxySocketHandshakeQueryKeys) {
              query[queryKey] = handshakeQuery[queryKey];
            }
          }
          else {
            logger.error('Could not find socket handshake query options!');
            process.exit(1);
          }
        }

        proxyClientSocket = socketIOClient(proxyHost, { path: proxySocketPath, rejectUnauthorized: false, query });
        patch(proxyClientSocket);
      }

      proxyClientSocket.on('*', function (packet) {
        let { event, payload } = parsePacket(packet);
        if (event !== undefined && event !== 'handshake') {
          proxyServerSocket.emit(event, payload);
        }
      });

      socket.on('*', function (packet) {
        let { event, payload } = parsePacket(packet);
        if (event !== undefined && event !== 'handshake') {
          proxyClientSocket.emit(event, payload);
        }
      });
    });
  }
}

/**
 * Starts an express server
 * @param expressConfig - The server config object
 * @param basePath - The base path to resolve files from
 */
module.exports = function startExpressServer({ expressConfig, basePath, mode, logger = console, addMiddleware = null, onStart }) {
  const app = express();

  /**
   * The expressConfig contains config settings specific to serving files
   *
   * REQUIRED
   * productName - The name of the project
   * host - The host to print to the console
   * port - The port to start the server on
   *
   * OPTIONAL
   * keyPath - The path to the HTTPS key file, when set the server to start in https mode (* when both set)
   * certPath - The path to the HTTPS certificate file, when set the server to start in https mode
   * openBrowser - A boolean flag that when true will cause a browser window to open to the server host after the server is started
   * compress - A boolean flag that when true will enable compression of all responses from the server
   * staticMap - a map of server request paths to relative file paths to be served statically by the server (syntax ex: { "/static/": "/filePath"})
   * staticQueryMap - a map of server request paths to query param matchers and relative file paths to be served dynamically by the server (syntax ex: { "/staticQuery/": [{ matcher: query => query === 'a', file: "/fileA"}, { matcher: query => query === 'b', file: "/fileB"}])
   * proxy - the configuration for the server's proxying capabilities
   *   proxyHost - The host to proxy requests to
   *   proxyHttpPaths - The list of http/https paths to proxy to the proxyHost
   *   proxySocketPath - The path of web socket requests to be proxied to the proxyHost
   *   proxySocketQueryKeys - An array of request query fields to be forwarded from the socket handshake
   *   proxyHeaderKeysForced - An array of strings that when not undefined will control the headers that get proxied to/from the proxyHost
   *   proxyHeaderKeysExtra - An array of strings that when not undefined will be added to the headers that get proxied to/from the proxyHost
   * serverPath - the base path to append to the server url
   */
  const {
    productName, host, port, secure, openBrowser, compress, staticMap, staticQueryMap, proxy, serverPath = ''
  } = expressConfig;

  if (compress) {
    app.use(compression());
  }

  if (staticMap) {
    for (let staticPath in staticMap) {
      app.use(staticPath, express.static(path.join(basePath, staticMap[staticPath])));
    }
  }

  if (staticQueryMap) {
    for (let staticQueryPath in staticQueryMap) {
      let matcherDefs = staticQueryMap[staticQueryPath];
      app.use(staticQueryPath, function (req, res) {
        const { query } = req;
        const matcherDef = matcherDefs.find(matcherDef => matcherDef.matcher(query));
        if (matcherDef) {
          res.sendFile(path.join(basePath, matcherDef.file));
        }
        else {
          res.status(404).send('File Not Found For Query');
        }
      });
    }
  }

  if (staticMap) {
    for (let staticPath in staticMap) {
      // Make sure we generate 404 responses for any unfound static assets
      app.use(staticPath, function (req, res) {
        res.status(404).send('File Not Found');
      });
    }
  }

  if (proxy) {
    addProxyMiddleware(app, proxy);
  }

  let closeMiddleware = null;
  if (addMiddleware) {
    const closeMiddlewareCallback = addMiddleware(app);
    if (closeMiddlewareCallback && typeof closeMiddlewareCallback === "function") {
      closeMiddleware = closeMiddlewareCallback;
    }
  }

  let expressServer;
  if (secure) {
    const { keyPath, certPath } = secure;
    expressServer = https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, app);
  }
  else {
    expressServer = http.createServer(app);
  }

  if (proxy) {
    addProxySocket(expressServer, proxy, logger);
  }

  let theServer;

  function startServerCallback(error) {
    if (error) {
      logger.error(error);
    } else {
      theServer.keepAliveTimeout = 0; // FIX for Node 8 issue: https://github.com/glenjamin/webpack-hot-middleware/issues/210
      const url = `${secure ? 'https://' : 'http://'}${host}:${port}${serverPath}/`;
      logger.log(`===> ${productName} on port ${port} in ${mode} mode. ${openBrowser ? 'Opening' : 'Open up'} ${url} in your browser.`);
      if (openBrowser) {
        open(url);
      }
      if (onStart) {
        onStart();
      }
    }
  }

  function getCloseServerPromise() {
    return new Promise((resolve, reject) => {
      try {
        expressServer.close(() => resolve());
      }
      catch (error) {
        reject(error);
      }
    });
  }

  function getCloseMiddlewarePromise() {
    return new Promise((resolve, reject) => {
      if (closeMiddleware) {
        closeMiddleware.then(() => resolve(), () => reject());
      } else {
        resolve();
      }
    });
  }

  function stopServer() {
    logger.log(`===> ${productName} on port ${port} in ${mode} mode shutting down`);
    return getCloseMiddlewarePromise().then(() => getCloseServerPromise(), () => getCloseServerPromise());
  }

  theServer = expressServer.listen(port, startServerCallback);

  return stopServer;
};
