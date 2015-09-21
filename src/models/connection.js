var app = require('ampersand-app');
var Connection = require('mongodb-connection-model');
var connectionSync = require('./connection-sync')();
var types = require('./types');
var testClientConnection = require('scout-client').test;
var debug = require('debug')('scout:models:connection');
/**
 * Configuration for connecting to a MongoDB Deployment.
 */
module.exports = Connection.extend({
  session: {
    /**
     * Updated on each successful connection to the Deployment.
     */
    last_used: 'date'
  },
  use: function(uri) {
    var data = types.url(uri).data;
    this.port = data.hosts[0].port;
    this.hostname = data.hosts[0].host.toLowerCase();
    this.fetch();
  },
  test: function(done) {
    var model = this;
    debug('Testing connection to `%j`...', this);

    testClientConnection(app.endpoint, this, function(err) {
      if (err) return done(err);

      debug('test worked!');
      done(null, model);
    });
    return this;
  },
  sync: connectionSync
});
