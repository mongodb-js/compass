const Connection = require('mongodb-connection-model');
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
const ConnectionDisk = Connection.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'Connections',
  storage: {
    backend: 'disk',
    appName: appName
  },
  serialize: function() {
    return Connection.prototype.serialize.call(this, {
      all: true
    });
  }
});

module.exports = ConnectionDisk;
