const defaultRouterBasePath = '/';
const defaultGlobalConfigKey = '__config';

const configKeys = [
  'routerBasePath'
];

class Config {

  constructor(globalConfigKey = defaultGlobalConfigKey) {
    this._routerBasePath = defaultRouterBasePath;

    if (window[globalConfigKey] !== undefined) {
      let config = window[globalConfigKey];
      for (let configKey of configKeys) {
        if (config[configKey] !== undefined) {
          this['_' + configKey] = config[configKey];
        }
      }
    }
  }

  getRouterBasePath() {
    return this._routerBasePath;
  }
}

export const config = new Config();