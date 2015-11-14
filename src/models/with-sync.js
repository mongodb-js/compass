var withSync = function(fn) {
  return {
    sync: function(method, model, options) {
      var done = function(err, res) {
        if (options.success) {
          options.success(res);
        } else if (options.error) {
          options.error(err);
        }
      };

      options.model = model;
      options.method = method;

      fn.apply(model, [options, done]);
    }
  };
};

module.exports = withSync;
