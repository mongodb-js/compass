// Wrap an optional error callback with a fallback error event.
module.exports = function(model, options) {
  var fn = options.error;
  options.error = function(resp) {
    if (fn) fn(model, resp, options);
    model.trigger('error', model, resp, options);
  };
};
