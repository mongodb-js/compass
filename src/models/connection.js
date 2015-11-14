var app = require('ampersand-app');
var Connection = require('mongodb-connection-model');
var connectionSync = require('./connection-sync')();
var client = require('scout-client');
var debug = require('debug')('scout:models:connection');
var uuid = require('uuid');
var metrics = require('mongodb-js-metrics');

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
    last_used: {
      type: 'date',
      default: null
    },
    is_favorite: {
      type: 'boolean',
      default: false
    }
  },
  session: {
    active: {
      type: 'boolean',
      default: false
    }
  },
  test: function(done) {
    var model = this.serialize();

    var onInstanceFetched = function(err, res) {
      if (!err) {
        debug('woot.  all gravy!  able to see %s collections', res.collections.length);
        done(null, this);
        return;
      }
      debug('could not get collection list :( sending to bugsnag for follow up...');
      metrics.error(err, 'collection list failed');
      done(err);
    }.bind(this);

    var onTested = function(err) {
      if (err) {
        metrics.error(err, 'connection test failed');
        return done(err);
      }

      debug('test worked!');
      debug('making sure we can get collection list...');
      client(app.endpoint, model).instance(onInstanceFetched);
    };

    debug('Testing connection to `%j`...', model);
    client.test(app.endpoint, model, onTested);
    return this;
  },
  sync: connectionSync,
  serialize: function() {
    return Connection.prototype.serialize.call(this, {
      all: true
    });
  }
});
