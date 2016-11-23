const electronApp = require('electron').remote.app;
const ConnectionCollection = require('../models/connection-collection');

/**
 * From 1.4.0 and higher connections would have their passwords stored as plaintext.
 * This migration resaves the connections with the COMPASS-426 fixes so the
 * attributes get saved in the correct place.
 *
 * @see COMPASS-426
 */
function removePlaintextPasswords(done) {
  debug('migration: removePlaintextPasswords');
  const connections = new ConnectionCollection();
  connections.once('sync', function() {
    connections.each(function(connection) {
      // We destroy the connection and resave it so the passwords move to the
      // correct storage.
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
    removePlaintextPasswords
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'successful migration to remove plaintext passwords');
  });
};
