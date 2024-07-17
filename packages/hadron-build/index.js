'use strict';
exports = function() {};

exports.release = require('./commands/release');
exports.upload = require('./commands/upload');
exports.download = require('./commands/download');
exports.verify = require('./commands/verify');

module.exports = exports;
