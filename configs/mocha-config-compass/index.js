const path = require('path');

module.exports = {
  colors: true,
  timeout: 15000,
  require: [
    path.resolve(__dirname, 'tsnode-register.js'),
    path.resolve(__dirname, 'sinon-chai-register.js'),
  ],
  spec: 'src/**/*.spec.*',
  watchFiles: 'src/**/*',
};
