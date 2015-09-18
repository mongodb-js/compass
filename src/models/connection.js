var Model = require('ampersand-model');
var Connection = require('mongodb-connection-model');
var format = require('util').format;
var connectionSync = require('./connection-sync')();
var types = require('./types');
var ScoutClient = require('scout-client/lib/client');
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
    var client = new ScoutClient({
      seed: this.uri
    }).on('readable', function() {
      debug('successfully connected!');
      client.close();
      done(null, model);
    }).on('error', function(err) {
      done(err, model);
      client.close();
    });
    return this;
  },
  sync: connectionSync
});
