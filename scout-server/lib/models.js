var brain = require('mongoscope-brain');

module.exports.deployments = {
  fetch: function(fn) {
    brain.store.all(fn);
  }
};


module.exports.instances = {
  findOne: function(spec, fn) {
    brain.store.findOne(spec, fn);
  }
};

module.exports.types = brain.types;
