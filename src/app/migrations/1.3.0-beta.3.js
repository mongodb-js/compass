var async = require('async');
var Connection = require('mongodb-connection-model');
var Preferences = require('compass-preferences-model');

// var debug = require('debug')('mongodb-compass:migrations:1.3.0-beta.3');

var PreferenceMigrationModel = Preferences.extend({
  extraProperties: 'ignore',
  props: {
    /**
     * Switch to enable/disable special treasure hunt features for
     * MongoDB World 2016.
     *
     * @type {Boolean}
     */
    treasureHunt: ['boolean', false]
  }
});

/**
 * Delete `treasureHunt` feature flag from saved preferences, and enable
 * single document CRUD feature flag.
 *
 * @param  {Function} done   callback when finished
 */
function deleteTreasureHuntFeatureFlagAndEnableCRUD(done) {
  var oldPrefs = new PreferenceMigrationModel();
  oldPrefs.once('sync', function() {
    oldPrefs.unset('treasureHunt');
    oldPrefs.singleDocumentCrud = true;
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
 * Remove special connection from the favorites used for the
 * MongoDB World 2016 treasure hunt
 *
 * @param  {Function} done   callback when finished
 */
function removeTreasureHuntConnection(done) {
  var connection = new Connection({
    _id: 'mongodb-world-treasure-hunt-connection',
    hostname: 'world2016-shard-00-00-uuein.mongodb.net',
    port: 27017,
    name: 'The Lost Temple',
    last_used: new Date('1699-12-03T04:00:00-0500'),
    is_favorite: true,
    authentication: 'MONGODB',
    mongodb_username: 'blackbeard',
    mongodb_password: 'AmSPLBc3I2I6SyyE',
    mongodb_database_name: 'admin',
    ssl: 'UNVALIDATED'
  });
  connection.destroy({
    success: function() {
      done(null);
    },
    error: function(model, err) {
      done(err);
    }
  });
}

module.exports = function(previousVersion, currentVersion, callback) {
  // do migration tasks here
  async.series([
    removeTreasureHuntConnection,
    deleteTreasureHuntFeatureFlagAndEnableCRUD
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'successful migration to 1.3.0-beta.3');
  });
};
