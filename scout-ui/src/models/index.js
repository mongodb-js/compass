var brain = require('../../../scout-brain');
var client = require('../../../scout-client')();
var _ = require('underscore');

// Wrap an optional error callback with a fallback error event.
var wrapError = function(model, options) {
  var error = options.error;
  options.error = function(resp) {
    if (error) error(model, resp, options);
    model.trigger('error', model, resp, options);
  };
};

module.exports.CollectionCollection = brain.models.CollectionCollection.extend({});

module.exports.DocumentCollection = brain.models.DocumentCollection.extend({
  fetch: function(options) {
    options = options ? _.clone(options) : {};
    if (!options.parse) {
      options.parse = true;
    }
    var model = this;
    var success = options.success;
    options.success = function(resp) {
      if (!model.set(model.parse(resp, options), options)) return false;
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    wrapError(this, options);

    client.sample(this.ns, {}, function(err, d) {
      if (err) return options.error({}, 'error', err.message);
      options.success(d, 'success', d);
    });
  }
});

module.exports.Instance = brain.models.Instance.extend({
  fetch: function(options) {
    options = options ? _.clone(options) : {};
    if (!options.parse) {
      options.parse = true;
    }
    var model = this;
    var success = options.success;
    options.success = function(resp) {
      if (!model.set(model.parse(resp, options), options)) return false;
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    wrapError(this, options);

    client.instance(function(err, d) {
      if (err) return options.error({}, 'error', err.message);
      options.success(d, 'success', d);
    });
  }
});
