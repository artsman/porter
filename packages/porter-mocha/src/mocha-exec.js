const Mocha = require('mocha');

const porterRegister = require('@porterjs/babel-register');

/**
 * Exits Mocha when tests + code under test has finished execution (default)
 * @param {number} code - Exit code; typically # of failures
 */
const doExitLater = code => {
  process.on('exit', () => {
    process.exit(Math.min(code, 255));
  });
};

/**
 * Exits Mocha when Mocha itself has finished execution, regardless of
 * what the tests or code under test is doing.
 * @param {number} code - Exit code; typically # of failures
 */
const doExit = code => {
  const clampedCode = Math.min(code, 255);
  let draining = 0;

  // Eagerly set the process's exit code in case stream.write doesn't
  // execute its callback before the process terminates.
  process.exitCode = clampedCode;

  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  const done = () => {
    if (!draining--) {
      process.exit(clampedCode);
    }
  };

  const streams = [process.stdout, process.stderr];

  streams.forEach(stream => {
    // submit empty write request and wait for completion
    draining += 1;
    stream.write('', done);
  });

  done();
};

module.exports = function mochaExec({ mochaConfig, logger = console }) {

  const { files, exit, extensions } = mochaConfig;

  // porterRegister({ mode: "test", modules: true, logger  });

  const mocha = new Mocha();
  mocha.files = files.reduce((files, file) => {
    files = files.concat(Mocha.utils.lookupFiles(file, extensions || ['js']));
    return files;
  }, []);
  runner = mocha.run(exit ? doExit : doExitLater);

  process.on('SIGINT', () => {
    runner.abort();

    // This is a hack:
    // Instead of `process.exit(130)`, set runner.failures to 130 (exit code for SIGINT)
    // The amount of failures will be emitted as error code later
    runner.failures = 130;
  });
}