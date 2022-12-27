const path = require('path');
const mochaConfig = require('@mongodb-js/mocha-config-compass/compass-plugin');

module.exports = {
  ...mochaConfig,
  require: [
    ...mochaConfig.require,
    // This package requires custom test setup for Leaflet support.
    path.resolve(__dirname, 'test', 'setup.js'),
  ],
};
