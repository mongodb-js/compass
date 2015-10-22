var app = require('ampersand-app');
var BaseConnection = require('mongodb-connection-model');
var connectionSync = require('./connection-sync')();
var client = require('scout-client');
var debug = require('debug')('scout:models:connection');
var bugsnag = require('../bugsnag');

/**
 * Configuration for connecting to a MongoDB Deployment.
 */
var Connection = BaseConnection.extend({
  idAttribute: '_id',
  props: {
    _id: {
      type: 'string',
      default: function() {
        return this.friendlyName;
      }
    },
    /**
     * Updated on each successful connection to the Deployment.
     */
    last_used: 'date',
    is_favorite: {
      type: 'boolean',
      default: false
    },
    has_connected: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    friendlyName: {
      deps: ['name'],
      fn: function() {
        if (this.name) return this.name;
        var name = this.hostname + ':' + this.port;
        switch (this.authentication) {
        case 'MONGODB':
          name = this.mongodb_username + '@' + name;
          break;
        case 'KERBEROS':
          name = this.kerberos_principal + '@' + name;
          break;
        case 'X509':
          name = this.x509_username + '@' + name;
          break;
        case 'LDAP':
          name = this.ldap_username + '@' + name;
          break;
        case 'NONE':
        default:
          break;
        }
        return name;
      }
    }
  },
  /**
   * Called by `./src/connect/index.js` to make sure
   * the user can connect to MongoDB before trying to
   * open the schema view.
   * @param {Function} done - Callback `(err, model)`
   *
   * @return {Object}    this
   * @see `scout-client#test()` http://git.io/vWLRf
   */
  test: function(done) {
    var model = this;
    var connection = model.serialize({
      all: true
    });

    var onInstanceFetched = function(err, res) {
      client(app.endpoint, connection).close()

      if (!err) {
        debug('woot.  all gravy!  able to see %s collections', res.collections.length);
        done(null, model);
        return;
      }
      debug('could not get collection list :( sending to bugsnag for follow up...');
      bugsnag.notify(err, 'collection list failed');
      done(err);
    };

    debug('Can we connect with `%j`?', connection);
    client.test(app.endpoint, connection, function(err) {
      if (err) {
        bugsnag.notify(err, 'connection test failed');
        return done(err);
      }

      debug('test worked!');
      debug('Can we use `%j` to actually get a list of collections?', connection);
      client(app.endpoint, connection).instance(onInstanceFetched);
    });
    return this;
  },
  sync: connectionSync
});

module.exports = Connection;
