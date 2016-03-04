/**
 * Wrap an optional error callback with a fallback error event.
 * @param {Object} model - The model|collection being sync'd.
 * @param {Object} options - Standard ampersand.js sync options.
 */
module.exports = function(model, options) {
  var fn = options.error;
  options.error = function(resp) {
    if (fn) {
      fn(model, resp, options);
    }
    model.trigger('error', model, resp, options);
  };
};
