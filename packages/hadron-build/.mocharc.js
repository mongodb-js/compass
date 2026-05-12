'use strict';
const base = require('@mongodb-js/mocha-config-compass');
// Include lib/ spec files until they are moved to src/ in Step 5
module.exports = {
  ...base,
  spec: [...base.spec, 'lib/**/*.spec.*'],
};
