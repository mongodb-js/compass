const Connection = require('mongodb-connection-model');
const storageMixin = require('storage-mixin');

let appName;
let basepath;

try {
  const remote = require('@electron/remote');
  appName = remote.app.getName();
  basepath = remote.app.getPath('userData');
} catch (e) {
  /* eslint no-console: 0 */
  console.log('Could not load @electron/remote', e.message);
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
    basepath,
  },
  serialize: function () {
    return Connection.prototype.serialize.call(this, {
      all: true,
    });
  },
  validate: function () {},
});

module.exports = ConnectionDisk;
