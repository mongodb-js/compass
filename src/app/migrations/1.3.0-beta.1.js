var async = require('async');
var app = require('ampersand-app');

/**
 * Add a special connection to the favorites for the treasure hunt
 *
 * @param  {Function} done   callback when finished
 */
function enableMapsAndExplainPlans(done) {
  app.preferences.save({enableMaps: true, showExplainPlanTab: true}, {
    success: done.bind(null, null)
  });
}

module.exports = function(previousVersion, currentVersion, callback) {
  // do migration tasks here
  async.series([
    enableMapsAndExplainPlans
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'successful migration to 1.3.0-beta.1');
  });
};
