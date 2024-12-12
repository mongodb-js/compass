'use strict';
exports = function () {};

exports.info = require('./commands/info');
exports.release = require('./commands/release');
exports.upload = require('./commands/upload');
exports.download = require('./commands/download');

module.exports = exports;
