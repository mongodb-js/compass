var app = require('ampersand-app');
var Connection = require('mongodb-connection-model');
var storageMixin = require('storage-mixin');
var client = require('mongodb-scope-client');
var debug = require('debug')('mongodb-compass:models:connection');
var uuid = require('uuid');
var metrics = require('mongodb-js-metrics');
var pkg = require('../../package.json');


/**
 * Configuration for connecting to a MongoDB Deployment.
 */
module.exports = Connection.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'Connections',
  storage: {
    backend: 'splice',
    appName: pkg.product_name
  },
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
    selected: {
      type: 'boolean',
      default: false
    }
    // active: {
    //   type: 'boolean',
    //   default: false
    // }
  },
  derived: {
    // canonical username independent of authentication method
    username: {
      deps: ['authentication'],
      fn: function() {
        if (this.authentication === 'NONE') {
          return '';
        }
        if (this.authentication === 'MONGODB') {
          return this.mongodb_username;
        }
        if (this.authentication === 'KERBEROS') {
          return this.kerberos_principal;
        }
        if (this.authentication === 'X509') {
          return this.x509_username;
        }
        if (this.authentication === 'LDAP') {
          return this.ldap_username;
        }
      }
    }
  },
  test: function(done) {
    var model = this.serialize();
    var onTested = function(err) {
      if (err) {
        metrics.error(err, 'connection test failed');
        return done(err);
      }

      debug('test worked!');
      done(null, this);
    }.bind(this);

    debug('Testing connection to `%j`...', model);
    client.test(app.endpoint, model, onTested);
    return this;
  },
  serialize: function() {
    return Connection.prototype.serialize.call(this, {
      all: true
    });
  }
});
