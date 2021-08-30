const preset = require('@mongodb-js/mocha-config-compass');

module.exports = {
  ...preset,
  spec: '{src,test}/**/*.spec.*',
  watchFiles: '{src,test}/**/*',
};
