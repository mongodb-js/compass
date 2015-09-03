/**
 * Run scout-server as a child_process so the UI is more
 * insulated from potential network problems and so the
 * rest of the app has a much smaller footprint on the
 * main electron process.
 *
 * `scout-server-ctl` forks a new process of
 * `bin/mongodb-scout-server.js` tracking it's PID
 * so it can be killed off when the main process quits,
 * as well as cleaning up any zombie processes on start.
 */
var fs = require('fs');
var path = require('path');
var app = require('app');
var child_process = require('child_process');
var debug = require('debug')('scout:electron:scout-server-ctl');

// Where we'll keep the process id.
var PID_FILE = path.resolve(app.getPath('appData'), '.mongodb-scout-server.pid');

// Path to the file we'll fork.
var BIN = path.resolve(__dirname, '../../bin/mongodb-scout-server.js');

// Load the pid from `PID_FILE`
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
  killIfRunning(function(err) {
    if (err) return done(err);

    var server = child_process.fork(BIN, [], {
      env: {
        ATOM_SHELL_INTERNAL_RUN_AS_NODE: 1,
        RESOURCES_PATH: process.resourcesPath
      }
    });
    debug('scout-server started with pid `%s`', server.pid);
    fs.writeFile(PID_FILE, server.pid, done);
  });
};

module.exports.stop = killIfRunning;
