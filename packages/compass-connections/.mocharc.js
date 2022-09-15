const base = require('@mongodb-js/mocha-config-compass/compass-plugin');

module.exports = {
  ...base,
  require: base.require.concat(['./test/mocha-plugins.ts']),
};
