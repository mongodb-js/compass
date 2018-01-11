var fs = require('fs');
var async = require('async');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
var parseURL = require('mongodb/lib/url_parser');
var Connection = require('./model');
var createSSHTunnel = require('./ssh-tunnel');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('mongodb-connection-model:connect');

function needToLoadSSLFiles(model) {
  return !_.includes(['NONE', 'UNVALIDATED'], model.ssl);
}

function loadOptions(model, done) {
  if (!needToLoadSSLFiles(model)) {
    process.nextTick(function() {
      done(null, model.driver_options);
    });
    return;
  }

  var tasks = {};
  var opts = _.clone(model.driver_options, true);
  Object.keys(opts.server).map(function(key) {
    if (key.indexOf('ssl') === -1) {
      return;
    }

    if (Array.isArray(opts.server[key])) {
      opts.server[key].forEach(function(value) {
        if (typeof value === 'string') {
          tasks[key] = function(cb) {
            async.parallel(opts.server[key].map(function(k) {
              return fs.readFile.bind(null, k);
            }), cb);
          };
        }
      });
    }

    if (typeof opts.server[key] !== 'string') {
      return;
    }
    if (key === 'sslPass') {
      return;
    }

    tasks[key] = fs.readFile.bind(null, opts.server[key]);
  });
  async.parallel(tasks, function(err, res) {
    if (err) {
      return done(err);
    }
    Object.keys(res).map(function(key) {
      opts.server[key] = res[key];
    });
    done(null, opts);
  });
}

/**
 * Make sure the driver doesn't puke on the URL and cause
 * an uncaughtException.
 *
 * @param {Connection} model
 * @param {Function} done
 */
function validateURL(model, done) {
  var url = model.driver_url;
  try {
    parseURL(url, {}, done);
  } catch (e) {
    // URL parsing errors are just generic `Error` instances
    // so overwrite name so mongodb-js-server will know
    // the message is safe to display.
    e.name = 'MongoError';
    process.nextTick(function() {
      done(e);
    });
  }
}

function getStatusStateString(evt) {
  if (!evt) {
    return 'UNKNOWN';
  }

  if (evt.pending) {
    return 'PENDING';
  }

  if (evt.skipped) {
    return 'SKIPPED';
  }

  if (evt.error) {
    return 'ERROR';
  }

  if (evt.complete) {
    return 'COMPLETE';
  }
}

function getTasks(model, setupListeners) {
  var options = {};
  var tunnel;
  var db;
  var state = new EventEmitter();
  var tasks = {};
  var _statuses = {};

  var status = function(message, cb) {
    if (_statuses[message]) {
      return _statuses[message];
    }

    var ctx = function(err, opts) {
      options = opts;
      if (err) {
        state.emit('status', {
          message: message,
          error: err
        });
        if (cb) {
          return cb(err);
        }
        return err;
      }

      state.emit('status', {
        message: message,
        complete: true
      });
      if (cb) {
        return cb();
      }
    };

    ctx.skip = function(reason) {
      state.emit('status', {
        message: message,
        skipped: true,
        reason: reason
      });
      if (cb) {
        return cb();
      }
    };

    if (!ctx._initialized) {
      state.emit('status', {
        message: message,
        pending: true
      });
      ctx._initialized = true;
    }
    return ctx;
  };

  /**
   * TODO (imlucas) If localhost, check if MongoDB installed -> no: click/prompt to download
   * TODO (imlucas) If localhost, check if MongoDB running -> no: click/prompt to start
   * TODO (imlucas) dns.lookup() model.hostname and model.ssh_tunnel_hostname to check for typos
   */
  _.assign(tasks, {
    Validate: function(cb) {
      validateURL(model, status('Validate', cb));
    },
    'Load SSL files': function(cb) {
      var ctx = status('Load SSL files', cb);
      if (!needToLoadSSLFiles(model)) {
        return ctx.skip('The selected SSL mode does not need to load any files.');
      }

      loadOptions(model, ctx);
    }
  });

  _.assign(tasks, {
    'Create SSH Tunnel': function(cb) {
      var ctx = status('Create SSH Tunnel', cb);
      if (model.ssh_tunnel === 'NONE') {
        return ctx.skip('The selected SSH Tunnel mode is NONE.');
      }

      tunnel = createSSHTunnel(model, ctx);
    }
  });

  _.assign(tasks, {
    'Connect to MongoDB': function(cb) {
      var ctx = status('Connect to MongoDB');
      // @note: Durran:
      // This check here is to prevent the options getting set to a string when a URI
      // is passed through. This is a temporary solution until we refactor all of this.
      if (_.isString(options) || !options) {
        options = {};
      }
      const client = new MongoClient();
      if (setupListeners) {
        setupListeners(client);
      }
      client.connect(model.driver_url, options, function(err, _db) {
        ctx(err);
        if (err) {
          if (tunnel) {
            debug('data-service connection error, shutting down ssh tunnel');
            tunnel.close();
          }
          return cb(err);
        }
        db = _db;
        if (tunnel) {
          db.on('close', function() {
            debug('data-service disconnected. shutting down ssh tunnel');
            tunnel.close();
          });
        }
        cb();
      });
    }
  });

  /**
   * TODO (imlucas) Could have unintended consequences.
   */
  // _.assign(tasks, {
  //   'List Databases': function(cb) {
  //     var ctx = status('List Databases', cb);
  //     db.db('admin').command({listDatabases: 1},
  //       {readPreference: ReadPreference.secondaryPreferred}, ctx);
  //   }
  // });

  Object.defineProperties(tasks, {
    model: {
      get: function() {
        return model;
      },
      enumerable: false
    },
    driver_options: {
      get: function() {
        return options;
      },
      enumerable: false
    },
    db: {
      get: function() {
        return db;
      },
      enumerable: false
    },
    tunnel: {
      get: function() {
        return tunnel;
      },
      enumerable: false
    },
    state: {
      get: function() {
        return state;
      },
      enumerable: false
    }
  });

  return tasks;
}

function connect(model, setupListeners, done) {
  if (!(model instanceof Connection)) {
    model = new Connection(model);
  }

  if (!_.isFunction(done)) {
    done = function(err) {
      if (err) {
        throw err;
      }
    };
  }

  var tasks = getTasks(model, setupListeners);
  var logTaskStatus = require('debug')('mongodb-connection-model:connect:status');
  tasks.state.on('status', function(evt) {
    logTaskStatus('%s [%s]', evt.message, getStatusStateString(evt));
  });

  logTaskStatus('Connecting...');
  async.series(tasks, function(err) {
    if (err) {
      logTaskStatus('Error connecting:', err);
      return done(err);
    }
    logTaskStatus('Successfully connected');
    return done(null, tasks.db);
  });
  return tasks.state;
}

module.exports = connect;
module.exports.loadOptions = loadOptions;
module.exports.validateURL = validateURL;
module.exports.getTasks = getTasks;
module.exports.getStatusStateString = getStatusStateString;
