'use strict';
const base = require('@mongodb-js/mocha-config-compass');
// Include commands/ and lib/ spec files until they are moved to src/ in a later step
module.exports = {
  ...base,
  spec: [...base.spec, 'commands/**/*.spec.*', 'lib/**/*.spec.*'],
};
