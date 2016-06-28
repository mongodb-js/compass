var ncp = require('ncp');
var path = require('path');
var app = require('electron').app;

// var debug = require('debug')('mongodb-compass:migrations:1.2.0');

/**
 * In 1.2.0 we changed the user preferences location directory from
 * `mongodb-compass` to `MongoDB Compass`.
 *
 * This migration moves the directory to the new location.
 *
 * @param  {Function} done   callback when finished
 */
function changeUserDataDirectoryLocation(done) {
  var oldDir = 'mongodb-compass';
  // check if old preferences directory exists
  var oldUserDir = path.join(app.getPath('appData'), oldDir);
  var newUserDir = app.getPath('userData');

  ncp(oldUserDir, newUserDir, {clobber: false, stopOnErr: true},
    function(errCp) {
      if (errCp) {
        return done(errCp);
      }
      done();
    });
}

module.exports = function(previousVersion, currentVersion, callback) {
  // do migration tasks here
  changeUserDataDirectoryLocation(function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'successful migration to 1.2.0-beta.1');
  });
};
