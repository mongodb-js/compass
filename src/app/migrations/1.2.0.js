var Preferences = require('compass-preferences-model');
var User = require('compass-user-model');
var pkg = require('../../../package.json');
var async = require('async');
var app = require('hadron-app');

var debug = require('debug')('mongodb-compass:migrations:1.2.0');

var PreferenceMigrationModel = Preferences.extend({
  extraProperties: 'ignore',
  idAttribute: 'id',
  namespace: 'Preferences',
  storage: {
    backend: 'local',
    appName: pkg.productName
  }
});

var UserMigrationModel = User.extend({
  extraProperties: 'ignore',
  idAttribute: 'id',
  namespace: 'Users',
  storage: {
    backend: 'local',
    appName: pkg.productName
  }
});

// var debug = require('debug')('mongodb-compass:migrations:1.2.0');

/**
 * Imports the preferences from IndexedDB and converts them to JSON, using
 * the `disk` storage backend in the storage-mixin module.
 *
 * @param  {Function} done   callback when finished
 */
function convertPreferencesBackendToJSON(done) {
  debug('migration: convertPreferencesBackendToJSON');
  var oldPrefs = new PreferenceMigrationModel();
  oldPrefs.once('sync', function() {
    app.preferences.save(oldPrefs.serialize(), {
      success: function() {
        oldPrefs.destroy();
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
 * Imports the user data from IndexedDB and converts it to JSON, using
 * the `disk` storage backend in the storage-mixin module.
 *
 * @param  {Function} done   callback when finished
 */
function convertUserBackendToJSON(done) {
  debug('migration: convertUserBackendToJSON');

  var oldUser = new UserMigrationModel();
  oldUser.once('sync', function() {
    app.user.save(oldUser.serialize(), {
      success: function() {
        oldUser.destroy();
        done(null);
      },
      error: function(model, err) {
        done(err);
      }
    });
  });
  oldUser.fetch();
}

module.exports = function(previousVersion, currentVersion, callback) {
  if (previousVersion === '0.0.0') {
    return callback(null, '1.2.0 migration not required.');
  }
  // do migration tasks here
  async.series([
    convertPreferencesBackendToJSON,
    convertUserBackendToJSON
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'successful migration to 1.2.0');
  });
};
