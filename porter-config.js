// porter config file idea for having scripts in the config

// break down each tool into scripts, like this:

const productName = 'productName';
const productVersion = '1.0.0';
const publicPath = `/static/${productName}/`;
const sentryKey = 'my-sentry-project-key';

const outputPath = 'dist';

const porterConfig = {
  babel: {
    config: {
      targets: [
        "> 4%",
        "ie 11",
        "safari 8"
      ],
      modules: true,
      decorators: true,
      classProperties: true,
      objectRestSpread: true,
      reactJsx: true,
      forOfAsArray: false,
      reactRemovePropTypes: false,
      transformImportsMap: {},
      runtimeHelper: false,
      rewire: false
    },
    inputPath: 'src',
    scripts: [
      {
        name: 'build-es',
        outputPath: 'es',
        config: {
          modules: false
        }
      },
      {
        name: "build-lib",
        outputPath: 'lib'
      }
    ]
  },
  rollup: {
    config: {
      log: false,
      name: 'PorterRollupDemo',
      licenseFile: 'LICENSE',
      inputFile: "src/index.js",
      analyze: false,
      minify: false
    },
    babel: {
      config: {
        modules: false
      }
    },
    scripts: [
      {
        name: 'bundle',
        outputFile: `${outputPath}/porter-rollup-demo.js`,
        babel: {
          config: {
            runtimeHelper: true
          }
        },
        config: {
          analyze: true
        }
      },
      {
        name: 'bundle-min',
        outputFile: `${outputPath}/porter-rollup-demo.min.js`,
        babel: {
          config: {
            runtimeHelper: true,
            reactRemovePropTypes: true
          }
        },
        config: {
          minify: true
        }
      }
    ]
  },
  webpack: {
    config: {
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
      outputPath: `${outputPath}/${productName}`,
      publicPath: publicPath,
      bundleName: `bundle-${productName}-${productVersion}-[name]`,
      babelCacheDirectory: true,
      globalPackageMap: {
        "Raven": "raven-js"
      },
      defineMap: {
        VERSION: JSON.stringify(productVersion),
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
      //   "@localscope/localproject": {
      //     "assets": {
      //       "dist/localproject.css": "css/localproject.css"
      //     },
      //     "entries": [
      //       "css/localproject.css"
      //     ]
      //   }
      // },
      deployPackagePath: ".",
      localPackageAssetMap: {
        "@localscope/localproject": {
          "dist/localproject.css": "src/localproject.css"
        }
      },
      resolvePackagePath: ".",
      // resolveMap: {
      //   "js": {
      //     '@fortawesome/fontawesome-free-regular$': '@fortawesome/fontawesome-free-regular/shakable.es.js',
      //     '@fortawesome/fontawesome-free-solid$': '@fortawesome/fontawesome-free-solid/shakable.es.js'
      //   }
      // },
    },
    babel: {
      config: {
        modules: false
      }
    },
    express: {
      host: "localhost",
      port: "3000",
      indexPath: `/${productName}/`,
      secure: {
        keyPath: 'keys/localhost.key',
        certPath: 'keys/localhost.crt'
      },
      openBrowser: false,
      compress: true,
      serviceWorkerPath: false,
      proxy: false
    },
    scripts: [
      {
        name: 'pack',
        config: {
          mode: 'production',
          minify: true,
          hotModuleReplacement: false,
          reactHotLoader: false,
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
          reportFilename: "../bundle-analyzer/report.html",
          sentry: {
            baseSentryURL: 'https://sentry.mydomain.com/api/0',
            organization: 'my-sentry-organization',
            project: 'my-sentry-project',
            apiKey: 'my-api-key',
            release: productVersion,
            include: /\.js$|\.js.map$/,
            filenameTransform: filename => `~/static/${productName}/${filename}`
          },
          sentryUpload: false
        },
        express: {
          // productName: 'productName in production mode',
          productName: ({ express }) => {
            const { host, port, secure, openBrowser } = express;
            return `Running ${productName} in production mode, open${openBrowser ? 'ing' : ''} up http${secure ? 's' : ''}//${host}:${port} in your browser`;
          },
          templateObject: {
            config: {
              apiHost: 'https://localhost',
              authHost: 'https://localhost',
              routerBasePath: `/${productName}/`,
              logoUrl: `/static/${productName}/assets/logo.png`
            }
          }
        },
        scripts: [
          {
            name: 'pack-sentry',
            config: {
              sentryUpload: true
            }
          }
        ]
      },
      {
        name: 'dev',
        config: {
          mode: 'development',
          minify: false,
          hotModuleReplacement: true,
          reactHotLoader: true,
          split: false,
          vendor: false,
          splitVendor: false,
          localResolveMap: {
            "js": {
              "@localscope/localproject": {
                rootPath: "../localproject",
                configFile: "porter.js",
                srcPath: "src",
                entryFile: "index.js"
              }
            }
          },
          localResolvePackagePath: "."
        },
        express: {
          host: serverHost,
          port: serverPort,
          templateObject: {
            config: {
              apiHost: 'https://localhost',
              authHost: 'https://localhost',
              routerBasePath: `/${productName}/`,
              logoUrl: `${publicPath}assets/logo.png`
            }
          },
          proxy: {
            proxyHost: proxyHost,
            proxyHttpPaths: ['/api/v1', '/accounts'],
            proxySocketPath: '/stream/v1',
            proxySocketHandshakeQueryKeys: ['auth_type', 'auth_token']
          }
        }
      }
    ]
  },
  localConfigFile: "porter-local.js"
}




// Add a way to refer to script names in preceding  config

// This lets us group together config nicely with forks for script names

// How do configs access the script names?

// We could make the config a function that takes the script name as an argument and returns the config like this:

// With no script name (i.e. running all scripts) all of the script names will need to be processed

// The ...others properties of the first function argument will hold the porter config

// but this requires that we do a breadth first search on config sections to make sure
// config section functions are executed in the right order

const scriptedBabelConfigFunction = ({ scriptName, ...others }) => ({
  targets: scriptName === 'dev' ? ["> 10%"] : ["> 2%"],
  modules: scriptName === 'dev',
  // ...others // is this needed?
  // what does others hold right now? no other functions have run yet
});

const scriptedWebpackConfigFunction = ({ scriptName, ...others }) => ({
  mode: scriptName === 'dev' ? "development": "production",
  // ...others // is this needed?
  // what does others hold right now? babel config function has run
  // const { babel: babelConfig } = others;
});

const scriptedConfigFunctionConfig = {
  babel: {
    config: scriptedBabelConfigFunction,
    scripts: [
      {
        name: 'build-es',
        outputPath: 'es'
      },
      {
        name: "build-lib",
        outputPath: 'lib'
      }
    ]
  },
  webpack: {
    config: scriptedWebpackConfigFunction
  }
}

// Or we can allow the config to have strings with variables that get replaced like this:

const scriptedConfigTemplate = {
  targets: ["> 2%"],
  modules: true,
};




const referringPorterConfig = {
  babel: {
    config: {
      targets: [
        "> 4%",
        "ie 11",
        "safari 8"
      ],
      modules: true,
      decorators: true,
      classProperties: true,
      objectRestSpread: true,
      reactJsx: true,
      forOfAsArray: false,
      reactRemovePropTypes: false,
      transformImportsMap: {},
      runtimeHelper: false,
      rewire: false
    },
    inputPath: 'src',
    scripts: [
      {
        name: 'build-es',
        outputPath: 'es',
        config: {
          modules: false
        }
      },
      {
        name: "build-lib",
        outputPath: 'lib'
      }
    ]
  }
};