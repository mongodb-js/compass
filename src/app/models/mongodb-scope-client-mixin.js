var _ = require('lodash');
var wrapError = require('./wrap-error');
var raf = require('raf');

module.exports = {
  fetch: function(options) {
    var model = this;
    var url = _.result(model, 'url');

    options = options ? _.clone(options) : {};
    if (!options.parse) {
      options.parse = true;
    }

    var success = options.success;
    options.success = function(resp) {
      if (!model.set(model.parse(resp, options), options)) {
        return false;
      }
      if (success) {
        success(model, resp, options);
      }
      model.trigger('sync', model, resp, options);
    };

    wrapError(this, options);

    var done = function(err, res) {
      if (err) {
        return options.error({}, 'error', err.message);
      }
      raf(function onClientSuccess() {
        options.success(res, 'success', res);
      });
    };

    options.dataService.get(url, options, done);
  }
};
