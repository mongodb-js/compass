var scout = require('../');
var debug = require('debug')('scout-client:test:helpers');

scout.configure({
  endpoint: 'http://localhost:29017',
  mongodb: 'localhost:27017'
});

module.exports = {
  client: null,
  createClient: function(opts) {
    opts = opts || {};
    module.exports.client = scout(opts);
    return module.exports.client;
  },
  before: function(done) {
    if (!this || !this.test) {
      console.trace('Wha? No this.test?');
    }
    // debug('before: %s', this.test.name);
    module.exports.createClient()
    .once('error', done)
    .once('readable', done.bind(null, null));
  },
  after: function(done) {
    if (!module.exports.client) {
      debug('after: no client to close');
      return done();
    }

    debug('after: closing client');
    module.exports.client.close(function(err) {
      debug('after: client closed');

      if (err) return done(err);
      module.exports.client = null;

      debug('after: complete');
      done();
    });
  }
};
