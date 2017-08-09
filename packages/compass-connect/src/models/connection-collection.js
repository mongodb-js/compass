const Collection = require('ampersand-rest-collection');
const storageMixin = require('storage-mixin');
const electronApp = require('electron').remote.app;
const Connection = require('./connection');

const ConnectionCollection = Collection.extend(storageMixin, {
  model: Connection,
  namespace: 'Connections',
  storage: {
    backend: 'splice',
    appName: electronApp.getName()
  },
  mainIndex: '_id',
});

module.exports = ConnectionCollection;
