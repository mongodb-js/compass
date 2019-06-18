const Connection = require('./model');
const storageMixin = require('storage-mixin');
const uuid = require('uuid');

let appname;

try {
  const electron = require('electron');

  appname = electron.remote ? electron.remote.app : undefined;
} catch (e) {
  /* eslint no-console: 0 */
  console.log('Could not load electron', e.message);
}

/**
 * Configuration for connecting to a MongoDB Deployment.
 */
module.exports = Connection.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'Connections',
  storage: {
    backend: 'splice',
    appname,
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
    ns: { type: 'string', default: undefined },
    isSrvRecord: { type: 'boolean', default: false }
  },
  session: { selected: { type: 'boolean', default: false } },
  derived: {
    // canonical username independent of authentication method
    username: {
      deps: ['authentication'],
      fn: function() {
        if (this.authentication === 'NONE') {
          return '';
        }
        if (this.authentication === 'MONGODB') {
          return this.mongodbUsername;
        }
        if (this.authentication === 'KERBEROS') {
          return this.kerberosPrincipal;
        }
        if (this.authentication === 'X509') {
          return this.x509Username;
        }
        if (this.authentication === 'LDAP') {
          return this.ldapUsername;
        }
      }
    }
  },
  serialize() {
    return Connection.prototype.serialize.call(this, { all: true });
  }
});
