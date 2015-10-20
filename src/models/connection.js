var app = require('ampersand-app');
var Connection = require('mongodb-connection-model');
var connectionSync = require('./connection-sync')();
var client = require('scout-client');
var debug = require('debug')('scout:models:connection');
var uuid = require('uuid');
var bugsnag = require('../bugsnag');

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
    last_used: 'date',
    is_favorite: {
      type: 'boolean',
      default: false
    }

  },
  test: function(done) {
    var model = this;
    debug('Testing connection to `%j`...', this);
    client.test(app.endpoint, model.serialize({
      all: true
    }), function(err) {
      if (err) {
        bugsnag.notify(err, 'connection test failed');
        return done(err);
      }

      debug('test worked!');
      debug('making sure we can get collection list...');
      client(app.endpoint, model.serialize({
        all: true
      })).instance(function(err, res) {
        if (!err) {
          debug('woot.  all gravy!  able to see %s collections', res.collections.length);
          done(null, model);
          return;
        }
        debug('could not get collection list :( sending to bugsnag for follow up...');
        bugsnag.notify(err, 'collection list failed');
        done(err);
      });
    });
    return this;
  },
  sync: connectionSync,
  serialize: function() {
    return Connection.prototype.serialize.call(this, {
      all: true
    });
  }
});
