const babelRegister = require("@babel/register");
const loadPorterConfig = require("@porterjs/config");
const createBabelConfig = require("@porterjs/babel-config");

const porterConfig = loadPorterConfig(process.cwd(), process.argv);

const { babel } = porterConfig;
const { targets, options, presets, plugins } = babel;

function register(registerOptions = {}) {
  const { mode = "test", modules = true } = registerOptions;

  const babelConfig = createBabelConfig({
    targets,
    options,
    presets,
    plugins,
    mode,
    modules
  });

  babelRegister({
    babelrc: false,
    presets: babelConfig.presets,
    plugins: babelConfig.plugins
  });
};

exports = module.exports = function(...args) {
  return register(...args);
};

register();

exports.__esModule = true;