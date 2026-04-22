'use strict';
const base = require('@mongodb-js/mocha-config-compass/compass-plugin');
module.exports = {
  ...base,
  spec: [...base.spec, 'tests/**/*.spec.*'],
};
