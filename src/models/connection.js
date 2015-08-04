var Model = require('ampersand-model');
var format = require('util').format;
var connectionSync = require('./connection-sync')();
var types = require('./types');
var Client = require('scout-client/lib/client');
var debug = require('debug')('mongodb-desktop:models:connection');
/**
 * Configuration for connecting to a MongoDB Deployment.
 */
module.exports = Model.extend({
  namespace: 'Connection',
  idAttribute: 'uri',
  props: {
    /**
     * User specified name for this connection.
     */
    name: {
      type: 'string',
      default: 'Local'
    },
    /**
     * Hostname or IP address of the Instance to connect to in the Deployment.
     */
    hostname: {
      type: 'string',
      default: 'localhost'
    },
    /**
     * Port the Instance to connect to in the Deployment is listening on.
     */
    port: {
      type: 'number',
      default: 27017
    },
    /**
     * Updated on each successful connection to the Deployment.
     */
    last_used: 'date'
  },
  derived: {
    uri: {
      deps: ['hostname', 'port'],
      fn: function() {
        return format('mongodb://%s:%d', this.hostname, this.port);
      }
    }
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
    var client = new Client({
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
