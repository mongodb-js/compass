var backends = require('./backends');

/**
 * storage-mixin
 *
 * Use this mixin with Ampersand models and collections to easily persist
 * them to a number of different storage backends.
 */
module.exports = {
  storage: 'local',
  _initializeMixin: function() {
    var storage = (typeof this.storage === 'object') ? this.storage : {
      backend: this.storage
    };
    storage.namespace = this.namespace;
    this._storageBackend = new backends[storage.backend](storage);
  },
  sync: function(method, model, options) {
    if (!this._storageBackend) {
      this._initializeMixin();
    }
    this._storageBackend.exec(method, model, options);
  }
};
