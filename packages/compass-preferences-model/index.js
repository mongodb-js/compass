var Model = require('./lib/model');
var { getGlobalConfigPaths, loadGlobalConfig } = require('./lib/global-config');

module.exports = Model;
module.exports.getGlobalConfigPaths = getGlobalConfigPaths;
module.exports.loadGlobalConfig = loadGlobalConfig;
