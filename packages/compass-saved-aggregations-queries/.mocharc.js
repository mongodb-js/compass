const base = require('@mongodb-js/mocha-config-compass/compass-plugin');
const path = require('path');

module.exports = {
  ...base,
  require: (base.require || []).concat(
    [
      path.resolve(__dirname, 'tests', 'setup.ts'),
    ].filter(Boolean)
  ),
};

