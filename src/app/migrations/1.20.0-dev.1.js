const async = require('async');
const debug = require('debug')('mongodb-compass:migrations');
const Connection, { ConnectionCollection } = require('mongodb-connection-model');

/**
 * This migration fixes the SSL fields on the newly migrated models.
 *
 * @param {Function} done - The done callback.
 */
const fixSslFields = (done) => {
  debug('migration: fixSslFields');
  const connections = new ConnectionCollection();
  connections.once('sync', function() {
    const toBeSaved = connections.map(function(connection) {
      if (Connection.SSL_METHOD_VALUES.includes(connection.ssl)) {
        connection.sslMethod = connection.ssl;
        connection.ssl = true;
      }
      return (callback) => {
        const valid = connection.save({}, {
          success: () => {
            callback(null);
          },
          error: () => {
            callback(null);
          }
        });
        if (!valid) {
          callback(null);
        }
      };
    });
    async.parallel(toBeSaved, function(err) {
      if (err) {
        debug('error saving connections', err.message);
      }
      done();
    });
  });
  connections.fetch({ reset: true });
};

module.exports = (previousVersion, currentVersion, callback) => {
  async.series([
    fixSslFields
  ], function(err) {
    if (err) {
      debug('encountered an error in the migration', err);
      return callback(err);
    }
    callback(null, 'successful migration to fix ssl');
  });
};
