var backends = require('./backends');
var debug = require('debug')('storage-mixin');

/**
 * storage-mixin
 *
 * Use this mixin with Ampersand models and collections to easily persist
 * them to a number of different storage backends.
 */
module.exports = {
  TestBackend: require('./backends/test'),
  secureMain: backends['secure-main'],
  storage: 'local',
  session: {
    fetched: {
      type: 'boolean',
      required: true,
      default: false
    }
  },
  _initializeMixin: function() {
    var storage = this.storage;
    if (typeof this.storage !== 'object') {
      storage = {
        backend: this.storage
      };
    }
    storage.namespace = this.namespace;
    this._storageBackend = new backends[storage.backend](storage);
  },
  sync: function(method, model, options) {
    if (!this._storageBackend) {
      this._initializeMixin();
    }
    var self = this;
    var success = options.success;
    options.success = function(resp) {
      if (success) {
        self.fetched = true;
        success.call(self, resp);
      }
    };

    options.error = function(resp, err) {
      debug('Unexpected storage-mixin sync error', { err: err, resp: resp });
      throw err;
    };
    this.fetched = false;
    this._storageBackend.exec(method, model, options);
  }
};
