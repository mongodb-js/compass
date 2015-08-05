var fs = require('fs');
var path = require('path');
var app = require('app');
var debug = require('debug')('scout:electron:setup');

var SETUP_PATH = path.join(app.getPath('userData'), 'setup-completed.json');
var SETUP_VERSION = '1.0.0';

module.exports = function showSetupOrStart() {
  fs.exists(SETUP_PATH, function(exists) {
    if (!exists) {
      debug('no setup-completed.json yet');
      return app.emit('open-setup-dialog');
    }
    fs.readFile(SETUP_PATH, function(err, buf) {
      if (err) return console.log(err);

      var d;
      try {
        d = JSON.parse(buf);
      } catch (e) {
        return console.log(err);
      }
      debug('user completed setup version %s at %s', d.version, d.completed_at);
      if (d.version !== SETUP_VERSION) {
        debug('new setup version available so showing setup again.');
        return app.emit('open-setup-dialog');
      }
      // @todo (imlucas): Restore windows instead of bringing up connect all the time...
      app.emit('open-connect-dialog');
    });
  });
};

module.exports.markComplete = function(done) {
  var data = {
    version: SETUP_VERSION,
    completed_at: new Date()
  };
  fs.writeFile(SETUP_PATH, JSON.stringify(data), done);
};
