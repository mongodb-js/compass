/**
 * Helper so you can just use errbacks (`function(err, res)`)
 * when calling ampersand sync methods instead of forgetting
 * to always check for the oddities of the sync api.
 *
 * @param {String} method
 * @param {Object} model
 * @param {Object} options
 * @return {Function}
 */
function createErrback(method, model, options) {
  return function(err, res) {
    if (options.success) {
      options.success(res);
    } else if (options.error) {
      options.error(err);
    }
  };
}

module.exports = createErrback;
