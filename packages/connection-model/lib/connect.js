var fs = require('fs');
var async = require('async');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
var parseURL = require('mongodb/lib/url_parser');
var Connection = require('./model');
var createSSHTunnel = require('./ssh-tunnel');
var EventEmitter = require('events').EventEmitter;

var debug = require('debug')('mongodb-connection-model:connect');

function loadOptions(model, done) {
  if (model.ssl === 'NONE' || model.ssl === 'UNVALIDATED') {
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
      tasks[key] = function(cb) {
        async.parallel(opts.server[key].map(function(k) {
          return fs.readFile.bind(null, k);
        }), cb);
      };
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
  debug('validating URL with driver...');
  try {
    var res = parseURL(url);
    debug('URL parsed ok', res);
    done(null, url);
  } catch (e) {
    debug('error parsing URL', e);
    // URL parsing errors are just generic `Error` instances
    // so overwrite name so mongodb-js-server will know
    // the message is safe to display.
    e.name = 'MongoError';
    process.nextTick(function() {
      done(e);
    });
  }
}

function getTasks(model) {
  var options = {};
  var tunnel;
  var db;
  var state = new EventEmitter();
  var tasks = {};

  /**
   * TODO (imlucas) If localhost, check if MongoDB installed -> no: click/prompt to download
   * TODO (imlucas) If localhost, check if MongoDB running -> no: click/prompt to start
   */

  _.assign(tasks, {
    'Validate driver URL': function(cb) {
      validateURL(model, cb);
    },
    'Load driver options': function(cb) {
      loadOptions(model, function(err, opts) {
        if (err) {
          return cb(err);
        }
        options = opts;
        cb();
      });
    }
  });

  if (model.ssh_tunnel !== 'NONE') {
    _.assign(tasks, {
      'Create SSH Tunnel': function(cb) {
        tunnel = createSSHTunnel(model, cb);
        tunnel.on('status', function(evt) {
          state.emit('status', evt);
        });
      }
    });

    // TODO (imlucas) Figure out how to make this less flakey.
    // tasks['Test SSH Tunnel'] = function(cb) {
    //   tunnel.test(cb);
    // };
  }

  _.assign(tasks, {
    'Connect': function(cb) {
      MongoClient.connect(model.driver_url, options, function(err, _db) {
        if (err) {
          return cb(err);
        }
        db = _db;
        cb();
      });
    }
  });

  /**
   * TODO (imlucas) Option to check if can run a specific command/read|write to collection.
   */

  Object.defineProperties(tasks, {
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

function connect(model, done) {
  if (!(model instanceof Connection)) {
    model = new Connection(model);
  }

  var tasks = getTasks(model);
  async.series(tasks, function(err) {
    if (err) {
      return done(err);
    }
    return done(null, tasks.db);
  });
  return tasks.state;
}

module.exports = connect;
module.exports.loadOptions = loadOptions;
module.exports.validateURL = validateURL;
module.exports.getTasks = getTasks;
