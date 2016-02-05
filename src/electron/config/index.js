var debug = require('debug')('mongodb-compass:electron:config');

module.exports = {
  windows: require('./windows'),
  buildInfo: require('./buildinfo.json')
};

debug('buildInfo: %j', module.exports.buildInfo);
