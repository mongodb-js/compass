const backoff = require('backoff');
const Connection = require('./extended-model');
const MongoClient = require('mongodb').MongoClient;
const debug = require('debug')('mongodb-connection-model:connect-with-backoff');

module.exports = (model, done) => {
  if (!(model instanceof Connection)) {
    model = new Connection(model);
  }

  const url = model.driverUrl;
  const opts = model.driverOptions;
  let call;

  const onConnected = (err, db) => {
    if (err) {
      debug('%s connection attempts to %s failed. giving up.', url, call.getNumRetries());

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
