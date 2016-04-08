exports = function() {};

exports.clean = require('./commands/clean');
exports.develop = require('./commands/develop');
exports.test = require('./commands/test');
exports.ui = require('./commands/ui');
exports.verify = require('./commands/verify');

module.exports = exports;
