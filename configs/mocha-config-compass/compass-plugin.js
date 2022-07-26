const path = require('path');

module.exports = {
  ...require('./react'),
  // electron-mocha config options (ignored when run with just mocha)
  // https://github.com/jprichardson/electron-mocha
  renderer: true,
  'require-main': path.resolve(__dirname, 'main-process.js'),
  'window-config': path.resolve(__dirname, 'window-config.json'),
  'no-sandbox': true,
};
