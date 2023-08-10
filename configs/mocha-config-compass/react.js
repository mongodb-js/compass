'use strict';

const path = require('path');
const base = require('@mongodb-js/mocha-config-devtools/react');

module.exports = {
  ...base,
  require: [
    ...base.require,
    path.resolve(__dirname, 'register', 'resolve-from-source-register.js'),
  ],
};
