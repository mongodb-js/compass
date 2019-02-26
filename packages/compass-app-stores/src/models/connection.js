import Connection from 'mongodb-connection-model';
import storageMixin from 'storage-mixin';
import DataService from 'mongodb-data-service';
import uuid from 'uuid';
import jsMetrics from 'mongodb-js-metrics';
const metrics = jsMetrics();
import electron from 'electron';
const electronApp = electron.remote.app;

/**
 * Configuration for connecting to a MongoDB Deployment.
 */
export default Connection.extend(storageMixin, {
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
    const dataService = new DataService(this);
    const onTested = function(err) {
      if (err) {
        metrics.error(err);
        return done(err);
      }

      dataService.disconnect();
      done(null, this);
    }.bind(this);

    dataService.connect(onTested);
    return this;
  },
  serialize: function() {
    return Connection.prototype.serialize.call(this, {
      all: true
    });
  }
});
