var _ = require('lodash');

/**
 * Merges splice results together.
 *
 * @param {Array} nonSecureResults - The results from non-secure storage.
 * @param {Array} secureResults - The results from secure storage.
 * @param {Model} model - The model.
 * @param {Function} done - The done callback.
 *
 * @returns {Object} the return value of done callback.
 */
var mergeSpliceResults = function(nonSecureResults, secureResults, model, done) {
  if (model.isCollection) {
    const merged = nonSecureResults.reduce((results, value) => {
      const matchingSecure = secureResults.find((result) => {
        return result[model.mainIndex] === value[model.mainIndex];
      });
      results.push(_.merge(value, matchingSecure));
      return results;
    }, []);
    return done(null, merged);
  }
  done(null, _.merge(nonSecureResults, secureResults));
};

module.exports.mergeSpliceResults = mergeSpliceResults;
