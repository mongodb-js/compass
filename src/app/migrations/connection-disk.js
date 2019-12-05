const Connection = require('mongodb-connection-model');
const storageMixin = require('storage-mixin');

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
const ConnectionDisk = Connection.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'Connections',
  storage: {
    backend: 'disk',
    namespace: 'Connections',
    appName: appName,
    basepath
  },
  serialize: function() {
    return Connection.prototype.serialize.call(this, {
      all: true
    });
  },
  validate: function() {
  }
});

module.exports = ConnectionDisk;
