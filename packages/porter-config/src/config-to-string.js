function replacer(key, value) {
  if (value instanceof RegExp || value instanceof Function) {
    return value.toString();
  }
  else {
    return value;
  }
}

module.exports = function configToString(config) {
  return JSON.stringify(config, replacer, '\t');
}