const path = require('path');
const base = require('./');

module.exports = {
  ...base,
  require: base.require.concat([
    'jsdom-global/register',
    path.resolve(__dirname, 'chai-dom-register.js'),
  ]),
};
