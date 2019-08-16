const babelCore = require("@babel/core");
const readdirRecursive = require("fs-readdir-recursive");
const mkdirpSync = require("mkdirp").sync;
const outputFileSync = require("output-file-sync");
const defaults = require("lodash/defaults");
const includes = require("lodash/includes");
const slash = require("slash");
const fs = require("fs");
const path = require("path");

const CALLER = {
  name: "@porterjs/babel",
};

module.exports = function babelExec({ inputPath, outputPath, babelConfig, logger = console, extensions, sourceMaps, description = null }) {
  runBabel(inputPath, outputPath, extensions, sourceMaps, babelConfig, logger, description);
}

async function runBabel(inputPath, outputPath, extensions, sourceMaps, babelConfig, logger, description) {
  mkdirpSync(outputPath);

  let compiledFiles = await handle(inputPath, outputPath, extensions, sourceMaps, babelConfig, logger);

  logger.log(
    `Successfully compiled ${compiledFiles} ${
    compiledFiles !== 1 ? "files" : "file"
    } with Babel${description !== null ? ' (' + description + ')' : ''}.`,
  );
}

function readdir(dirname, includeDotfiles, filter) {
  return readdirRecursive(dirname, (filename, _index, currentDirectory) => {
    const stat = fs.statSync(path.join(currentDirectory, filename));

    if (stat.isDirectory()) return true;

    return (
      (includeDotfiles || filename[0] !== ".") && (!filter || filter(filename))
    );
  });
}

async function handle(inputPath, outputPath, extensions, sourceMaps, babelConfig, logger) {
  if (!fs.existsSync(inputPath)) return 0;

  const stat = fs.statSync(inputPath);

  if (stat.isDirectory()) {
    const dirname = inputPath;

    let count = 0;

    const files = readdir(dirname, false);
    for (const filename of files) {
      const src = path.join(dirname, filename);

      const written = await handleFile(src, dirname, outputPath, extensions, sourceMaps, babelConfig, logger);
      if (written) count += 1;
    }

    return count;
  } else {
    const filename = inputPath;
    const written = await handleFile(filename, path.dirname(filename), outputPath, extensions, sourceMaps, babelConfig, logger);

    return written ? 1 : 0;
  }
}

async function handleFile(src, base, outputPath, extensions, sourceMaps, babelConfig, logger) {
  const written = await write(src, base, outputPath, extensions, sourceMaps, babelConfig, logger);
  return written;
}

function isCompilableExtension(filename, forcedExts) {
  const exts = forcedExts || babelCore.DEFAULT_EXTENSIONS;
  const ext = path.extname(filename);
  return includes(exts, ext);
}

function adjustRelative(relative, keepFileExtension) {
  if (keepFileExtension) {
    return relative;
  }
  return relative.replace(/\.(\w*?)$/, "") + ".js";
}

function getDest(filename, base, relative, outputPath) {
  if (relative) {
    return path.join(base, outputPath, filename);
  }
  return path.join(outputPath, filename);
}

function compile(filename, config) {
  let opts = {
    ...config,
    caller: CALLER
  };

  return new Promise((resolve, reject) => {
    babelCore.transformFile(filename, opts, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function write(src, base, outputPath, extensions, sourceMaps, babelConfig, logger) {
  let relative = path.relative(base, src);

  if (!isCompilableExtension(relative, extensions)) {
    return false;
  }

  // remove extension and then append back on .js
  relative = adjustRelative(relative, false);

  const dest = getDest(relative, base, false, outputPath);

  try {
    const res = await compile(
      src,
      defaults(
        {
          sourceFileName: slash(path.relative(dest + "/..", src)),
        },
        babelConfig,
      ),
    );

    if (!res) return false;

    // we've requested explicit sourcemaps to be written to disk
    if (
      res.map &&
      sourceMaps &&
      sourceMaps !== "inline"
    ) {
      const mapLoc = dest + ".map";
      res.code = addSourceMappingUrl(res.code, mapLoc);
      res.map.file = path.basename(relative);
      outputFileSync(mapLoc, JSON.stringify(res.map));
    }

    outputFileSync(dest, res.code);
    chmod(src, dest);

    logger.info(src + " -> " + dest);

    return true;
  } catch (err) {
    throw err;
  }
}

function chmod(src, dest) {
  fs.chmodSync(dest, fs.statSync(src).mode);
}

function addSourceMappingUrl(code, loc) {
  return code + "\n//# sourceMappingURL=" + path.basename(loc);
}