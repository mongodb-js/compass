var debug = require('debug')('mongodb-compass:models:with-sync');
var withSync = function(fn) {
  return {
    sync: function(method, model, options) {
      var done = function(err, res) {
        debug('done called', {
          err: err,
          res: res
        });

        if (err) {
          if (options.error) {
            options.error(err, 'error', err.message);
          }
          model.trigger('error', err);
          return;
        }

        if (options.success) {
          options.success(res, 'success');
        }
        model.trigger('sync');
      };

      options.model = model;
      options.method = method;

      model.trigger('request', {}, {}, options);
      fn.apply(model, [options, done]);
    }
  };
};

module.exports = withSync;
