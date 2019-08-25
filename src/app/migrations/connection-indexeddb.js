const Connection = require('./legacy-connection');
const Collection = require('ampersand-rest-collection');
const storageMixin = require('storage-mixin');

let appName;

try {
  const electron = require('electron');
  appName = electron.remote ? electron.remote.app.getName() : undefined;
} catch (e) {
  /* eslint no-console: 0 */
  console.log('Could not load electron', e.message);
}

/**
 * Configuration for connecting to a MongoDB Deployment.
 */
const ConnectionIndexedDB = Connection.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'Connections',
  storage: {
    backend: 'splice',
    appName: appName,
    secureCondition: function(val, key) {
      return key.match(/(password|passphrase)/i);
    }
  },
  serialize: function() {
    return Connection.prototype.serialize.call(this, {
      all: true
    });
  }
});

module.exports = ConnectionIndexedDB;

module.exports.ConnectionIndexedDBCollection = Collection.extend(storageMixin, {
  model: ConnectionIndexedDB,
  namespace: 'Connections',
  storage: {
    backend: 'splice',
    appName: appName
  },
  mainIndex: '_id'
});
