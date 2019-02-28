var Preferences = require('compass-preferences-model');
var ConnectionCollection = require('mongodb-connection-model').ConnectionCollection;
var pkg = require('../../../package.json');
var async = require('async');
var format = require('util').format;
var _ = require('lodash');

var debug = require('debug')('mongodb-compass:migrations:1.1.2');

var PreferenceMigrationModel = Preferences.extend({
  extraProperties: 'ignore',
  idAttribute: 'id',
  namespace: 'Preferences',
  storage: {
    backend: 'local',
    appName: pkg.productName
  },
  props: {
    intercom: ['boolean', false],
    bugsnag: ['boolean', false],
    googleAnalytics: ['boolean', false]
  }
});

/**
 * Renames the metrics preference variables to be more meaningful:
 *
 * preferences.googleAnalytics --> preferences.trackUsageStatistics
 * preferences.bugsnag --> preferences.trackErrors
 * preferences.intercom --> preferences.enableFeedbackPanel
 *
 * @param  {Function} done   callback when finished
 */
function renameMetricsVariables(done) {
  debug('migration: renameMetricsVariables');
  var oldPrefs = new PreferenceMigrationModel();
  oldPrefs.once('sync', function() {
    oldPrefs.trackUsageStatistics = _.get(oldPrefs, 'googleAnalytics', oldPrefs.trackUsageStatistics);
    oldPrefs.trackErrors = _.get(oldPrefs, 'bugsnag', oldPrefs.trackErrors);
    oldPrefs.enableFeedbackPanel = _.get(oldPrefs, 'intercom', oldPrefs.enableFeedbackPanel);
    oldPrefs.unset('googleAnalytics');
    oldPrefs.unset('intercom');
    oldPrefs.unset('bugsnag');
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
 * With the refactored sidebar in the connect dialog, the schema for
 * saved connections has changed slightly. Default names are no longer stored
 * in the connection but rather derived on the fly, should the name be empty.
 *
 * Existing non-favorite connections with a default name need their name,
 * and existing favorites need to be checked for duplicate names, as this is
 * no longer allowed.
 *
 * @param  {Function} done   callback when finished
 */
function removeSavedConnectionNames(done) {
  debug('migration: removeSavedConnectionNames');
  var connections = new ConnectionCollection();
  var favoriteNames = {};
  connections.once('sync', function() {
    connections.each(function(connection) {
      if (connection.is_favorite) {
        // favorite connections cannot have duplicate names anymore,
        // de-duplicate them by adding numbers to the end.
        if (connection.name in favoriteNames) {
          favoriteNames[connection.name] += 1;
          connection.name += format(' (%s)', favoriteNames[connection.name]);
        } else {
          favoriteNames[connection.name] = 1;
        }
      } else {
        // non favorite connections don't have an explicit name anymore,
        // it is now computed as a derived property.
        connection.name = '';
      }
      connection.save();
    });
    done();
  });
  connections.fetch({reset: true});
}

module.exports = function(previousVersion, currentVersion, callback) {
  // do migration tasks here
  async.series([
    renameMetricsVariables,
    removeSavedConnectionNames
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'successful migration to 1.1.2');
  });
};
