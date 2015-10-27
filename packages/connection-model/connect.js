var MongoClient = require('mongodb').MongoClient;
var backoff = require('backoff');
var Connection = require('./model');
var debug = require('debug')('mongodb-connection-model:connect');
var fs = require('fs');
var parallel = require('run-parallel');

function loadOptions(model, done) {
  if (model.ssl === 'NONE' || model.ssl === 'UNVALIDATED') {
    process.nextTick(function() {
      done(null, model.driver_options);
    });
    return;
  }

  var tasks = {};
  var opts = model.driver_options;
  Object.keys(opts.server).map(function(key) {
    if (key.indexOf('ssl') === -1) {
      return;
    }

    if (Array.isArray(opts.server[key])) {
      tasks[key] = function(cb) {
        parallel(opts.server[key].map(function(k) {
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
  parallel(tasks, function(err, res) {
    if (err) {
      return done(err);
    }
    Object.keys(res).map(function(key) {
      opts.server[key] = res[key];
    });
    done(null, opts);
  });
}

function connectWithBackoff(model, done) {
  if (!(model instanceof Connection)) {
    model = new Connection(model);
  }
  var url = model.driver_url;
  var opts = model.driver_options;
  var call;

  var onConnected = function(err, db) {
    if (err) {
      debug('%s connection attempts to %s failed.  giving up.', url, call.getNumRetries());
      return done(err);
    }
    debug('Successfully connected to %s after %s attempts!', url, call.getNumRetries());
    done(null, db);
  };

  call = backoff.call(MongoClient.connect, url, opts, onConnected);
  call.setStrategy(new backoff.ExponentialStrategy({
    randomisationFactor: 0,
    initialDelay: 500,
    maxDelay: 10000
  }));

  call.on('backoff', function(number, delay) {
    debug('connect attempt #%s failed.  retrying in %sms...', number, delay);
  });
  call.failAfter(25);
  call.start();
}

function connect(model, done) {
  if (!(model instanceof Connection)) {
    model = new Connection(model);
  }
  var url = model.driver_url;
  loadOptions(model, function(err, opts) {
    if (err) {
      return done(err);
    }
    MongoClient.connect(url, opts, done);
  });
}

if (process.env.MONGODB_BACKOFF) {
  module.exports = connectWithBackoff;
} else {
  module.exports = connect;
}

module.exports.loadOptions = loadOptions;
