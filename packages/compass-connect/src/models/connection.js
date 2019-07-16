const Model = require('mongodb-connection-model');
const storageMixin = require('storage-mixin');
const electronApp = require('electron').remote.app;

/**
 * Represents a connection to a MongoDB cluster.
 */
const Connection = Model.extend(storageMixin, {
  storage: {
    backend: 'splice',
    appname: electronApp.getName(),
    secureCondition: function(val, key) {
      return key.match(/(password|passphrase)/i);
    }
  },
  props: {
    appname: {
      type: 'string',
      default: electronApp.getName()
    }
  }
});

module.exports = Connection;
