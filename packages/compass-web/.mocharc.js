'use strict';
const config = require('@mongodb-js/mocha-config-compass/compass-plugin');

module.exports = {
  ...config,
  spec: [...config.spec, 'polyfills/**/*.spec.*', 'polyfills/**/*.test.*'],
};
