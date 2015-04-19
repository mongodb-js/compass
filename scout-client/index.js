var createClient = require('./lib/client');
var defaults = require('./lib/defaults');

module.exports = createClient;

module.exports.adapters = {
  Backbone: require('./lib/adapters/backbone')
};

module.exports.configure = function(config) {
  Object.keys(config).map(function(k) {
    if (k === 'endpoint') {
      defaults.scope = config[k];
    } else if (k === 'mongodb') {
      defaults.seed = config[k];
    } else {
      defaults[k] = config[k];
    }
  });
};
