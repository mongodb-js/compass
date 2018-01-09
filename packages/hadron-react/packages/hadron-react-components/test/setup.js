/* eslint no-undef: "off" */
/* eslint-env node */
require('babel-register')();

require('jsdom-global')();

global.navigator = {
  userAgent: 'node.js'
};
