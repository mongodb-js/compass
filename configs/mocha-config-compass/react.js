'use strict';

const path = require('path');
const base = require('@mongodb-js/mocha-config-devtools/react');

module.exports = {
  ...base,
  require: [
    // TEMP FIX TO BE REMOVED IN THE FOLLOW UP REACT 18 PR.
    // React 17 leaks a MessageChannel that keeps the node process alive after
    // tests finish (https://github.com/facebook/react/issues/20756).
    // We removed this from mocha-config-devtools, will be deleted from this repo as well.
    require.resolve('react-16-node-hanging-test-fix'),
    path.resolve(__dirname, 'register', 'mute-console-warnings-register.js'),
    ...base.require,
    path.resolve(__dirname, 'register', 'resolve-from-source-register.js'),
    path.resolve(__dirname, 'register', 'jsdom-extra-mocks-register.js'),
    path.resolve(__dirname, 'register', 'node-env-register.js'),
  ],
  'node-option': [
    // TODO(COMPASS-10162): see ./index.js
    'no-experimental-strip-types',
  ],
};
