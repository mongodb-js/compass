const Connection = require('./model');
const storageMixin = require('storage-mixin');
const { v4: uuidv4 } = require('uuid');
const { getStoragePaths } = require('@mongodb-js/compass-utils');
const { appName, basepath } = getStoragePaths() || {};

/**
 * Configuration for connecting to a MongoDB Deployment.
 */
const ExtendedConnection = Connection.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'Connections',
  storage: {
    backend:
      // eslint-disable-next-line no-nested-ternary
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true'
        ? 'disk' :
        typeof window === 'undefined' ? 'splice-disk' : 'splice-disk-ipc',
    namespace: 'Connections',
    basepath,
    appName, // Not to be confused with `props.appname` that is being sent to driver
    secureCondition: (val, key) => key.match(/(password|passphrase|secrets|sslpass)/i)
  },
  props: {
    _id: { type: 'string', default: () => uuidv4() },
    // Updated on each successful connection to the Deployment.
    lastUsed: { type: 'date', default: null },
    isFavorite: { type: 'boolean', default: false },
    name: { type: 'string', default: 'Local' },
    color: { type: 'string', default: undefined },
    ns: { type: 'string', default: undefined },
    isSrvRecord: { type: 'boolean', default: false },
    appname: { type: 'string', default: undefined } // Is being sent to driver
  },
  session: {
    selected: { type: 'boolean', default: false }
  },
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
    },
    title: {
      deps: [
        'name',
        'isFavorite',
        'isSrvRecord',
        'hostname',
        'port',
        'hosts'
      ],
      fn() {
        if (this.isFavorite && this.name) {
          return this.name;
        }

        if (this.isSrvRecord) {
          return this.hostname;
        }

        if (this.hosts && this.hosts.length > 1) {
          return this.hosts.map(
            ({ host, port }) => `${host}:${port}`
          ).join(',');
        }

        return `${this.hostname}:${this.port}`;
      },
      cache: false
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
ExtendedConnection.from = (url, callback) =>
  Connection.from(url, (error, c) => {
    if (error) {
      return callback(error);
    }

    callback(null, new ExtendedConnection(c.getAttributes({ props: true })));
  });

module.exports = ExtendedConnection;
