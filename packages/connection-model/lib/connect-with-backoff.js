var backoff = require('backoff');
var Connection = require('./extended-model');
var MongoClient = require('mongodb').MongoClient;
var debug = require('debug')('mongodb-connection-model:connect-with-backoff');

module.exports = function(model, done) {
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
};
