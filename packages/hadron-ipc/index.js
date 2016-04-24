'use strict';

const isRenderer = require('is-electron-renderer');

if (isRenderer) {
  module.exports = require('./renderer');
} else {
  module.exports = require('./main');
}
