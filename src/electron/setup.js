var fs = require('fs');
var app = require('app');
var config = require('./config');
var debug = require('debug')('scout:electron:setup');

module.exports = function showSetupOrStart() {
  fs.exists(config.get('setup:file'), function(exists) {
    if (!exists) {
      debug('no setup-completed.json yet');
      return app.emit('open-setup-dialog');
    }
    fs.readFile(config.get('setup:file'), function(err, buf) {
      if (err) return console.log(err);

      var d;
      try {
        d = JSON.parse(buf);
      } catch (e) {
        return console.log(err);
      }
      debug('user completed setup version %s at %s', d.version, d.completed_at);
      if (d.version !== config.get('setup:version')) {
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
    version: config.get('setup:version'),
    completed_at: new Date()
  };
  fs.writeFile(config.get('setup:file'), JSON.stringify(data), done);
};
