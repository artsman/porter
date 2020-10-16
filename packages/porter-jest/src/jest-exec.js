const jest = require('jest');

const args = (process.argv && process.argv.length > 2) ? process.argv.slice(2) : [];

module.exports = function jestExec({ jestConfig, logger = console }) {
  const newJestConfig = Object.assign({}, jestConfig, {
    transform: {
      "^.+\\.jsx?$": require.resolve('./jest-babel-transform.js')
    }
  });
  jest.run(['--config', JSON.stringify(newJestConfig)].concat(args));
}