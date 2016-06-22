var Preferences = require('../models/preferences');
var pkg = require('../../../package.json');
var async = require('async');
var ConnectionCollection = require('../models/connection-collection');
var _ = require('lodash');
var debug = require('debug')('mongodb-compass:migrations:1.3.0-beta.0');

var PreferenceMigrationModel = Preferences.extend({
  extraProperties: 'ignore',
  idAttribute: 'id',
  namespace: 'Preferences',
  storage: {
    backend: 'local',
    appName: pkg.productName
  },
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
 * Renames the metrics preference variable to be more meaningful:
 *
 * preferences.googleMaps --> preferences.enableMaps
 *
 * @param  {Function} done   callback when finished
 */
function addTreasureHuntConnection(done) {
  var connection = {
    _id: 'mongodb-world-treasure-hunt-connection',
    hostname: 'data.mongodb.parts',
    port: 27017,
    name: 'The Lost Temple',
    last_used: new Date('1996-12-06T04:00:00-0500'),
    is_favorite: true
    // authentication: 'MONGODB',
    // mongodb_username: 'foo',
    // mongodb_password: 'bar',
    // mongodb_database_name: 'admin'
  };
  var connections = new ConnectionCollection();
  connections.create(connection, {
    success: function() {
      done();
    },
    error: function(err) {
      done(err);
    }
  });
}

module.exports = function(previousVersion, currentVersion, callback) {
  // do migration tasks here
  async.series([
    renameMetricsVariables,
    addTreasureHuntConnection
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'successful migration to 1.3.0-beta.0');
  });
};
