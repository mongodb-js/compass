'use strict';

const isRenderer = require('is-electron-renderer');

if (isRenderer) {
  module.exports = require('./lib/renderer');
} else {
  module.exports = require('./lib/main');
}
