const path = require('path');
const config = require('@mongodb-js/mocha-config-compass/compass-plugin');

module.exports = {
  ...config,
  require: [
    ...config.require,
    path.resolve(__dirname, 'test', 'via-register.js'),
  ],
};
