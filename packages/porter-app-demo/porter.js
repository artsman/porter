const versionString = "1.0.0";
const sentryKey = "abcdefgh";
const productName = "webpackdemo";

module.exports = {
  babel: {
    targets: [
      "> 4%",
      "ie 11",
      "safari 8"
    ],
    options: {
      decorators: true,
      classProperties: true,
      objectRestSpread: true,
      reactJsx: true,
      forOfAsArray: false,
      reactRemovePropTypes: true,
      transformImportsMap: {},
      rewire: false
    }
  },
  webpack: {
    useEslint: false,
    srcPaths: [
      "src"
    ],
    css: true,
    sass: false,
    html: {
      indexFilename: "../index.html",
      templatePath: "src/templates/index.html"
    },
    polyfills: {
      babel: true,
      fetch: true,
      eventSource: true
    },
    entry: {
      name: "main",
      files: [
        "./src/index.js"
      ]
    },
    split: {
      minChunks: 1,
      minSize: 500,
      maxAsyncRequests: 15,
      maxInitialRequests: 3
    },
    vendor: {
      name: "vendors",
      minChunks: 1,
      minSize: 500,
      resourceFilter: /node_modules/
    },
    splitVendor: {
      name: "split-vendors",
      minChunks: 3,
      minSize: 500,
      resourceFilter: /node_modules/
    },
    outputPath: "dist/" + productName,
    publicPath: "/static/" + productName + "/",
    bundleName: "porter-" + productName + "-" + versionString + "-[name]",
    babelCacheDirectory: true,
    globalPackageMap: {
      "Raven": "raven-js"
    },
    defineMap: {
      VERSION: JSON.stringify(versionString),
      SENTRY_KEY: JSON.stringify(sentryKey),
      REDUX_LOGGER: true
    },
    noParse: /OptionalRegexpForPackagesNotToParse/,
    noopRegexps: [
      /aPackageThatShouldBeReplacedWithANoop/
    ],
    deployAssetMap: {
      "src/assets": "assets/"
    },
    // deployPackageAssetMap: {
    //   "@artsman/react-nav": {
    //     "assets": {
    //       "dist/navigation.css": "css/navigation.css"
    //     },
    //     "entries": [
    //       "css/navigation.css"
    //     ]
    //   }
    // },
    deployPackagePath: ".",
    localPackageAssetMap: {
      "@artsman/react-nav": {
        "dist/navigation.css": "src/navigation.css"
      }
    },
    // resolveMap: {
    //   "js": {
    //     '@fortawesome/fontawesome-free-regular$': '@fortawesome/fontawesome-free-regular/shakable.es.js',
    //     '@fortawesome/fontawesome-free-solid$': '@fortawesome/fontawesome-free-solid/shakable.es.js'
    //   }
    // },
    resolvePackagePath: ".",
    localResolveMap: {
      "js": {
        "@artsman/react-nav": {
          rootPath: "../react-nav",
          configFile: "porter.js",
          srcPath: "src",
          entryFile: "index.js"
        }
      }
    },
    localResolvePackagePath: ".",
    minify: true,
    hotModuleReplacement: true,
    reactHotLoader: true,
    reportFilename: "../bundle-analyzer/report.html",
    sentry: {
      baseSentryURL: 'https://sentry.artsman.com/api/0',
      organization: 'arts-management-systems',
      project: 'reveal',
      apiKey: 'https://99186408a520496cb107db23c4e0b675@sentry.artsman.com/6',
      release: versionString,
      include: /\.js$|\.js.map$/,
      filenameTransform: filename => `~/static/reveal/${filename}`
    },
    sentryUpload: false
  },
  eslint: {
    rules: {
      "semi": ["error", "always"]
    },
    plugins: [
      "import",
      "react"
    ],
    extends: [
      "eslint:recommended",
      "plugin:import/errors",
      "plugin:react/recommended"
    ],
    settings: {
      "react": {
        "version": "16"
      }
    },
    env: {
      "browser": true,
      // "node": true
    },
    files: 'src'
  },
  express: {
    productName: productName,
    host: "localhost",
    port: "4321",
    secure: undefined,
    openBrowser: false,
    compress: true,
    serviceWorkerPath: false,
    proxy: false,
    templateObject: {
      config: {
        routerBasePath: '/'
      }
    }
  }
};