var Preferences = require('compass-preferences-model');
var async = require('async');
var _ = require('lodash');
var debug = require('debug')('mongodb-compass:migrations:1.3.0-beta.0');

var PreferenceMigrationModel = Preferences.extend({
  extraProperties: 'ignore',
  props: {
    googleMaps: ['boolean', false]
  }
});

/**
 * Renames the metrics preference variable to be more meaningful:
 *
 * preferences.googleMaps --> preferences.enableMaps
 *
 * @param  {Function} done   callback when finished
 */
function renameMetricsVariables(done) {
  debug('running renameMetricsVariables');
  var oldPrefs = new PreferenceMigrationModel();
  oldPrefs.once('sync', function() {
    oldPrefs.enableMaps = _.get(oldPrefs, 'googleMaps', oldPrefs.enableMaps);
    oldPrefs.unset('googleMaps');
    oldPrefs.save(null, {
      success: function() {
        done(null);
      },
      error: function(model, err) {
        done(err);
      }
    });
  });
  oldPrefs.fetch();
}

/**
 * disable maps and explain plans for 1.3.0-beta.0
 *
 * @param  {Function} done   callback when finished
 */
function disableMapsAndExplainPlans(done) {
  var preferences = new Preferences();
  preferences.once('sync', function() {
    preferences.save({
      enableMaps: false,
      showExplainPlanTab: false,
      autoUpdates: true,
      showAutoUpdateBanner: false
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
    renameMetricsVariables,
    disableMapsAndExplainPlans
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'successful migration to 1.3.0-beta.0');
  });
};
