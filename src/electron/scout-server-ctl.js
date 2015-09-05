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
// var BIN = path.resolve(process.resourcesPath,
//   './app/node_modules/scout-server/bin/scout-server.js');
var BIN = path.resolve(__dirname, '../../node_modules/scout-server/bin/scout-server.js');

/**
 * Load the pid from `PID_FILE`
 * @param {Function} done - `(err, number)` callback
 * @api private
 */
var getPID = function(done) {
  fs.exists(PID_FILE, function(exists) {
    if (!exists) {
      return done(null, -1);
    }

    fs.readFile(PID_FILE, 'utf-8', function(err, buf) {
      if (err) {
        return done(err);
      }

      done(null, parseInt(buf, 10));
    });
  });
};

/**
 * If there is something in `PID_FILE`,
 * a previous attempt to start may have
 * gone awry and we should treat it as
 * an orphaned process.  However,
 * we also handle the case of the
 * `PID_FILE` just not being cleaned up properly.
 * @param {Function} done - `(err)` callback
 */
var killIfRunning = function(done) {
  getPID(function(err, pid) {
    if (err) {
      return done(err);
    }

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

/**
 * Try and start scout-server as a child_process.
 * @param {Function} done - `(err)` callback
 */
module.exports.start = function(done) {
  killIfRunning(function(err) {
    if (err) {
      return done(err);
    }

    // @note (imlucas): You're probably flinching that
    // spaces in these paths aren't escaped.  But fear
    // not!  `child_process.exec` has space escape issues
    // but not `child_process.spawn`!
    debug('spawning: `%s %s`...', process.execPath, BIN);
    var server = child_process.spawn(process.execPath, [BIN], {
      env: {
        ATOM_SHELL_INTERNAL_RUN_AS_NODE: '1',
        RESOURCES_PATH: process.resourcesPath
      },
      cwd: process.resourcesPath
    });
    server.stdout.on('data', function(buf) {
      debug('> server: %s', buf.toString('utf-8'));
    });
    server.stderr.on('data', function(buf) {
      debug('> server-stderr: %s', buf.toString('utf-8'));
    });

    // @todo (imlucas): Use `require('http').createClient()` and
    // http://npm.im/backoff to hit `http://localhost:29017/health-check`.
    // If the HTTP request fails or returns a non 200 HTTP status
    // the server didn't actually start and we should treat it as an
    // error starting the server.  This handles the case of user's
    // having another service that is *not* `scout-server` occupying
    // our default port.
    debug('scout-server started with pid `%s`!', server.pid);
    fs.writeFile(PID_FILE, server.pid, done);
  });
};

module.exports.stop = killIfRunning;
