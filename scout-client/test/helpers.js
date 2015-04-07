var scope = require('../');

process.env.NODE_ENV = 'ci';
if (typeof window !== 'undefined' && window.location.origin === 'http://localhost:8080') {
  process.env.NODE_ENV = 'testing';
}

scope.configure({
  endpoint: 'http://localhost:29017',
  mongodb: 'localhost:27017'
});

module.exports = {
  client: null,
  createClient: function(opts) {
    opts = opts || {};
    module.exports.client = scope(opts);
    return module.exports.client;
  },
  before: function(done) {
    module.exports.createClient()
    .on('error', done)
    .on('readable', done.bind(null, null));
  },
  after: function(done) {
    if (!module.exports.client) return done();

    module.exports.client.close(function(err) {
      if (err) return done(err);
      module.exports.client = null;
      done();
    });
  }
};
