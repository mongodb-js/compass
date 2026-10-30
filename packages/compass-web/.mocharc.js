'use strict';
const config = require('@mongodb-js/mocha-config-compass/compass-plugin');

module.exports = {
  ...config,
  require: [...config.require, './test/stub-utilities-register.js'],
  spec: [...config.spec, 'polyfills/**/*.spec.*', 'polyfills/**/*.test.*'],
};
