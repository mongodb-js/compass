'use strict';

const path = require('path');
const base = require('@mongodb-js/mocha-config-devtools');

const fs = require('fs');

console.log(
  'Exists',
  path.resolve(__dirname, 'reporter.js'),
  fs.existsSync(path.resolve(__dirname, 'reporter.js'))
);

module.exports = {
  ...base,
  reporter: path.resolve(__dirname, 'reporter.js'),
  require: [
    ...base.require,
    path.resolve(__dirname, 'register', 'resolve-from-source-register.js'),
    path.resolve(__dirname, 'register', 'node-env-register.js'),
  ],
};
