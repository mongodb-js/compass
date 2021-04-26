exports = function() {};

exports.clean = require('./commands/clean');
exports.develop = require('./commands/develop');
exports.release = require('./commands/release');
exports.test = require('./commands/test');
exports.ui = require('./commands/ui');
exports.upload = require('./commands/upload');
exports.verify = require('./commands/verify');

module.exports = exports;
