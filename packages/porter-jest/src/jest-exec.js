const jest = require('jest');

module.exports = function jestExec({ jestConfig, logger = console }) {
  const newJestConfig = Object.assign({}, jestConfig, {
    transform: {
      "^.+\\.jsx?$": require.resolve('./jest-babel-transform.js')
    }
  });
  jest.run(['--config', JSON.stringify(newJestConfig)]);
}