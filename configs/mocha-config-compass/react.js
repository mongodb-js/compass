'use strict';

const path = require('path');
const base = require('@mongodb-js/mocha-config-devtools/react');

module.exports = {
  ...base,
  require: [
    path.resolve(__dirname, 'register', 'mute-console-warnings-register.js'),
    ...base.require,
    path.resolve(__dirname, 'register', 'resolve-from-source-register.js'),
    path.resolve(__dirname, 'register', 'jsdom-extra-mocks-register.js'),
    path.resolve(__dirname, 'register', 'node-env-register.js'),
  ],
};
