const Model = require('mongodb-connection-model');
const storageMixin = require('storage-mixin');
const uuid = require('uuid');
const electronApp = require('electron').remote.app;

/**
 * Represents a connection to a MongoDB cluster.
 */
const Connection = Model.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'Connections',
  storage: {
    backend: 'splice',
    appName: electronApp.getName(),
    secureCondition: function(val, key) {
      return key.match(/(password|passphrase)/i);
    }
  },
  props: {
    _id: {
      type: 'string',
      default: function() {
        return uuid.v4();
      }
    },
    last_used: {
      type: 'date',
      default: null
    },
    is_favorite: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
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
  serialize: function() {
    return Connection.prototype.serialize.call(this, {
      all: true
    });
  }
});

module.exports = Connection;
