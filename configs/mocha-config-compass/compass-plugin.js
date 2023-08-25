'use strict';
const path = require('path');
const reactConfig = require('./react');

module.exports = {
  ...reactConfig,
  require: [
    ...reactConfig.require,
    path.resolve(__dirname, 'register', 'electron-renderer-register.js'),
    path.resolve(__dirname, 'register', 'compass-preferences-register.js'),
  ],
  // electron-mocha config options (ignored when run with just mocha)
  // https://github.com/jprichardson/electron-mocha
  renderer: true,
  'require-main': path.resolve(__dirname, 'main-process.js'),
  'window-config': path.resolve(__dirname, 'window-config.json'),
  'no-sandbox': true,
};
