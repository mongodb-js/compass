var app = require('ampersand-app');
var Connection = require('mongodb-connection-model');
var connectionSync = require('./connection-sync')();
var client = require('scout-client');
var debug = require('debug')('scout:models:connection');
var uuid = require('uuid');
/**
 * Configuration for connecting to a MongoDB Deployment.
 */
module.exports = Connection.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      default: function() {
        return uuid.v4();
      }
    },
    /**
     * Updated on each successful connection to the Deployment.
     */
    last_used: 'date'
  },
  test: function(done) {
    var model = this;
    debug('Testing connection to `%j`...', this);
    client.test(app.endpoint, this, function(err) {
      if (err) {
        return done(err);
      }

      debug('test worked!');
      done(null, model);
    });
    return this;
  },
  sync: connectionSync
});
