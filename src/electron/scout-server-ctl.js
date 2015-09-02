var fs = require('fs');
var path = require('path');
var PID_FILE = path.resolve(__dirname, 'scout-server.pid');
var child_process = require('child_process');
var BIN = path.resolve(__dirname, '../../node_modules/.bin/scout-server');
var debug = require('debug')('scout-server:ctl');

var getPID = function(done) {
  fs.exists(PID_FILE, function(exists) {
    if (!exists) return done(null, -1);

    fs.readFile(PID_FILE, 'utf-8', function(err, buf) {
      if (err) return done(err);

      done(null, parseInt(buf, 10));
    });
  });
};


var killIfRunning = function(done) {
  getPID(function(err, pid) {
    if (err) return done(err);

    if (pid === -1) {
      debug('no pid file');
      return done();
    }

    debug('killing existing pid', pid);
    try {
      process.kill(pid, 'SIGTERM');
    } catch (err) {
      if (err.code === 'ESRCH') {
        debug('orphaned pid file');
      }
    }

    fs.unlink(PID_FILE, done);
  });
};

module.exports.start = function(done) {
  console.log('Starting!', BIN);
  killIfRunning(function(err) {
    if (err) return done(err);

    var server = child_process.fork(BIN);
    fs.writeFile(PID_FILE, server.pid, done);
  });
};

module.exports.stop = killIfRunning;
