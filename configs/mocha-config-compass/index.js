const path = require('path');

module.exports = {
  colors: true,
  timeout: 15000,
  require: [
    path.resolve(__dirname, 'register', 'assets-import-register.js'),
    path.resolve(__dirname, 'register', 'tsnode-register.js'),
    path.resolve(__dirname, 'register', 'sinon-chai-register.js'),
  ],
  // This can be written as `{src,test}/**/*.{spec,test}.*`, but this causes
  // issues for mocha on some version. It will try to parse every string in the
  // array by splitting on commas causing a wrong spec pattern to be applied. It
  // is fixed in latest, but as we are still in the process of updaing
  // everything to the same version and working around the issue helps with
  // migration (this can be removed when mocha is not in depalignrc anymore)
  spec: [
    'src/**/*.spec.*',
    'src/**/*.test.*',
    'test/**/*.spec.*',
    'test/**/*.test.*',
  ],
  extension: ['js', 'ts', 'cjs', 'mjs', 'jsx', 'tsx'],
  watchFiles: ['test/**/*', 'src/**/*'],
};
