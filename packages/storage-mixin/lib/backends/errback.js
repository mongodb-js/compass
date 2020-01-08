const debug = require('debug')('mongodb-storage-mixin:backends:errback');

/**
 * Helper so you can just use errbacks `function(err, res)`
 * when calling ampersand sync methods instead of forgetting
 * to always check for the oddities of the sync api.
 *
 * @param {String} method
 * @param {Object} model
 * @param {Object} options
 * @return {Function}
 */
function wrapOptions(method, model, options) {
  return function(err, res) {
    if (err) {
      if (options.error) {
        return options.error(res, err);
      }
      debug('An error ocurred with no handler specified!', err);
      throw err;
    }

    if (options.success) {
      return options.success(res);
    }
  };
}

/**
 * The opposite of wrapOptions, this helper wraps an errback
 * and returns an options object that calls the errback appropriately.
 *
 * @param {Function} done
 * @return {Object}
 */
var wrapErrback = function(done) {
  return {
    success: function(res) {
      done(null, res);
    },
    error: function(res, err) {
      done(err);
    }
  };
};

module.exports.wrapOptions = wrapOptions;
module.exports.wrapErrback = wrapErrback;
