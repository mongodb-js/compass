const Connection = require('./model');
const storageMixin = require('storage-mixin');
const uuid = require('uuid');

/**
 * The name of a remote electon application that
 * uses `connection-model` as a dependency.
 */
let appName;
let basepath;

try {
  const electron = require('electron');

  appName = electron.remote ? electron.remote.app.getName() : undefined;
  basepath = electron.remote ? electron.remote.app.getPath('userData') : undefined;
} catch (e) {
  /* eslint no-console: 0 */
  console.log('Could not load electron', e.message);
}

/**
 * Configuration for connecting to a MongoDB Deployment.
 */
const ExtendedConnection = Connection.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'Connections',
  storage: {
    backend: 'splice-disk-ipc',
    namespace: 'Connections',
    basepath,
    appName, // Not to be confused with `props.appname` that is being sent to driver
    secureCondition: (val, key) => key.match(/(password|passphrase)/i)
  },
  props: {
    _id: { type: 'string', default: () => uuid.v4() },
    /**
     * Updated on each successful connection to the Deployment.
     */
    lastUsed: { type: 'date', default: null },
    isFavorite: { type: 'boolean', default: false },
    name: { type: 'string', default: 'Local' },
    color: { type: 'object', default: () => ({}) },
    ns: { type: 'string', default: undefined },
    isSrvRecord: { type: 'boolean', default: false },
    appname: { type: 'string', default: undefined } // Is being sent to driver
  },
  session: { selected: { type: 'boolean', default: false } },
  derived: {
    // Canonical username independent of authentication strategy
    username: {
      deps: ['authStrategy'],
      fn() {
        if (this.authStrategy === 'NONE') {
          return '';
        }
        if (this.authStrategy === 'MONGODB') {
          return this.mongodbUsername;
        }
        if (this.authStrategy === 'KERBEROS') {
          return this.kerberosPrincipal;
        }
        if (this.authStrategy === 'X509') {
          return this.x509Username;
        }
        if (this.authStrategy === 'LDAP') {
          return this.ldapUsername;
        }
      }
    }
  },
  serialize() {
    return Connection.prototype.serialize.call(this, { all: true });
  }
});

/**
 * Create a connection from a URI. This needs to ensure we create our subclass
 * or we won't have the storage mixin available.
 *
 * @param {String} url - The mongodb url to create from.
 * @param {Function} callback - The callback function.
 *
 * @returns {Function} callback
 */
ExtendedConnection.from = (url, callback) => Connection.from(url, (error, c) => {
  if (error) {
    return callback(error);
  }

  callback(null, new ExtendedConnection(c.getAttributes({ props: true })));
});

module.exports = ExtendedConnection;
