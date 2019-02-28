const async = require('async');
const debug = require('debug')('mongodb-compass:migrations');
const ConnectionCollection = require('mongodb-connection-model').ConnectionCollection;

/**
 * This migration removes and then re-saves all connections in order to trigger
 * the secureCondition of the "splice" storage backend again, which wasn't correctly
 * working in 1.4.1, see COMPASS-426.
 *
 * @param {Function} done - The done callback.
 */
function rewriteStoredConnections(done) {
  debug('migration: rewriteStoredConnections');
  const connections = new ConnectionCollection();
  connections.once('sync', function() {
    connections.each(function(connection) {
      // We destroy the connection and resave it to persist to the correct engine.
      if (connection) {
        connection.destroy();
        connection.save();
      }
    });
    done();
  });
  connections.fetch({ reset: true });
}

module.exports = function(previousVersion, currentVersion, callback) {
  async.series([
    rewriteStoredConnections
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'successful migration to remove plaintext passwords');
  });
};
