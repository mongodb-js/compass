var async = require('async');
var Preferences = require('compass-preferences-model');

/**
 * Enable maps and explain plan tree view features.
 *
 * @param  {Function} done   callback when finished
 */
function enableMapsAndExplainPlans(done) {
  var preferences = new Preferences();
  preferences.once('sync', function() {
    preferences.save({
      enableMaps: true,
      showExplainPlanTab: true,
      showAutoUpdateBanner: true
    }, {
      success: done.bind(null, null),
      error: done
    });
  });
  preferences.fetch();
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
