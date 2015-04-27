var _ = require('underscore');
var wrapError = require('./wrap-error');

module.exports = {
  fetch: function(options) {
    var model = this;
    var handler = _.result(model, 'scout');

    if (!handler || !_.isFunction(handler)) {
      throw new TypeError('No scout handler function declared on model or collection.');
    }

    options = options ? _.clone(options) : {};
    if (!options.parse) {
      options.parse = true;
    }

    var success = options.success;
    options.success = function(resp) {
      if (!model.set(model.parse(resp, options), options)) return false;
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };

    wrapError(this, options);

    var done = function(err, res) {
      if (err) return options.error({}, 'error', err.message);
      options.success(res, 'success', res);
    };

    handler.call(model, done);
  }
};
