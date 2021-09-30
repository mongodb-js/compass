const path = require('path');

module.exports = {
  colors: true,
  timeout: 15000,
  require: [
    path.resolve(__dirname, 'register', 'assets-import-register.js'),
    path.resolve(__dirname, 'register', 'tsnode-register.js'),
    path.resolve(__dirname, 'register', 'sinon-chai-register.js'),
  ],
  spec: '{src,test}/**/*.{spec,test}.*',
  watchFiles: '{src,test}/**/*',
};
