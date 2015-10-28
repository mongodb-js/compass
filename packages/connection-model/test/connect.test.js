var assert = require('assert');
var parallel = require('run-parallel');
var series = require('run-series');
var runner = require('mongodb-runner');
var running = require('is-mongodb-running');
var debug = require('debug')('mongodb-connection:test:connect');
var connect = require('../connect');
var ReadPreference = require('mongodb-read-preference');

function getBuildInfo(db, done) {
  debug('checking we can get buildInfo...');
  db.admin().buildInfo(function(err) {
    if (err) {
      debug('buildInfo failed!', err);
      err.command = 'buildInfo';
      return done(err);
    }

    done();
  });
}

function getHostInfo(db, done) {
  debug('checking we can get hostInfo...');
  var spec = {
    hostInfo: 1
  };
  var options = {};
  db.admin().command(spec, options, function(err) {
    if (err) {
      if (/^not authorized/.test(err.message)) {
        debug('hostInfo unavailable for this user and thats ok!');
        done();
        return;
      }
      debug('driver error', err);
      err.command = 'hostInfo';
      done(err);
      return;
    }
    debug('got hostInfo successully!');
    done();
  });
}

function getDatabaseNames(db, done) {
  debug('checking we can get database names...');
  var options = {
    readPreference: ReadPreference.nearest
  };

  var spec = {
    listDatabases: 1
  };

  db.admin().command(spec, options, function(err, res) {
    if (err) {
      debug('list database names failed', err);
      err.command = 'listDatabases';
      return done(err);
    }

    var names = res.databases.map(function(d) {
      return d.name;
    }).filter(function(name) {
      if (name === 'admin') return false;
      return true;
    });
    debug('list database names succeeded!', {
      res: res,
      names: names
    });
    done(null, names);
  });
}

function getDatabase(db, name, done) {
  var spec = {
    dbStats: 1
  };
  var options = {};
  debug('running dbStats for `%s`...', name);
  db.db(name).command(spec, options, function(err) {
    if (err) {
      debug('failed to get dbStats for `%s`', name, err);
      err.command = 'dbStats';
      done(err);
      return;
    }
    debug('got dbStats for `%s`', name);
    done();
  });
}

function getDatabases(db, done) {
  debug('checking we can get databases...');
  getDatabaseNames(db, function(err, names) {
    if (err) {
      return done(err);
    }
    parallel(names.map(function(name) {
      return getDatabase.bind(null, db, name);
    }), done);
  });
}

function getDatabaseCollections(db, name, done) {
  debug('getDatabaseCollections for `%s`...', name);

  var options = {
    readPreference: ReadPreference.nearest
  };
  var spec = {};

  db.db(name)
    // @note: Need to pass readPreference in options for 3.x
    .listCollections(spec, options)
    .toArray(function(err) {
      if (err) {
        err.command = 'listCollections';
        return done(err);
      }
      done();
    });
}

function getAllCollections(db, done) {
  debug('checking we can get all collections for databases...');
  getDatabaseNames(db, function(err, names) {
    if (err) {
      return done(err);
    }

    var tasks = names.map(function(name) {
      return getDatabaseCollections.bind(null, db, name);
    });

    parallel(tasks, function(_err) {
      if (_err) {
        debug('getCollections failed', _err);
        return done(_err);
      }
      debug('getCollections succeeded!');
      done();
    });
  });
}


var shouldGetInstanceDetails = function(db, done) {
  assert(db);
  series([
    getDatabaseNames.bind(null, db),
    getDatabases.bind(null, db),
    getAllCollections.bind(null, db),
    getBuildInfo.bind(null, db),
    getHostInfo.bind(null, db)
  ], done);
};

var format = require('util').format;
var data = require('mongodb-connection-fixture');
/* eslint no-console:0 */
console.log('Fixture matrix has %s connections we can test', data.MATRIX.length);

describe('mongodb-connection#connect', function() {
  describe('local', function() {
    before(function(done) {
      debug('checking if mongodb is running...');
      running(function(err, res) {
        debug('is-mongodb-running returned', err, res);

        if (res && res.length > 0) {
          if (res[0].port === 27017) {
            debug('mongodb already running on `localhost:27017` so we won\'t start a new one.');
            done();
            return;
          }

          debug('mongodb already running, but its on '
            + '`localhost:%d` and we need `localhost:27017` for '
            + 'the tests so starting up a new one.', res[0].port);
          runner({
            action: 'start'
          }, done);
          return;
        }
        debug('no mongodb running or detection failed so going to try and start one');
        runner({
          action: 'start'
        }, done);
        return;
      });
    });
    it('should connect to `localhost:27017`', function(done) {
      connect({
        hostname: 'localhost',
        port: 27017
      }, function(err, _db) {
        if (err) {
          return done(err);
        }

        shouldGetInstanceDetails(_db, done);
      });
    });
  });
  describe('cloud #slow', function() {
    data.MATRIX.map(function(d) {
      it(format('should connect to `%s`', d.name), function(done) {
        this.slow(2000);
        this.timeout(5000);
        connect(d, function(err, _db) {
          if (err) {
            return done(err);
          }
          shouldGetInstanceDetails(_db, done);
        });
      });
    });
  });
});
