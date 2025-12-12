'use strict';

const path = require('path');
const base = require('@mongodb-js/mocha-config-devtools');

module.exports = {
  ...base,
  reporter: path.resolve(__dirname, 'reporter.js'),
  require: [
    path.resolve(__dirname, 'register', 'mute-console-warnings-register.js'),
    ...base.require,
    path.resolve(__dirname, 'register', 'resolve-from-source-register.js'),
    path.resolve(__dirname, 'register', 'node-env-register.js'),
  ],
  'node-option': [
    // TODO(COMPASS-10162): starting with Node.js 22.15+ there is an issue
    // seemingly caused by Node.js still parsing files with .ts extension even
    // if experimental-strip-types option is not enabled. Explicitly disabling
    // experimental-strip-types option seems to work around this, but long term
    // a proper solution would be to switch our usage of ts-node (and a related
    // load from source mocha register functionality) from relying on cjs module
    // system to esm one (meaning we should use ts-node/esm instead of just
    // ts-node register)
    'no-experimental-strip-types',
  ],
};
