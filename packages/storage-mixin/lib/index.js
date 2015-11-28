var backends = require('./backends');
// var debug = require('debug')('storage-mixin');

module.exports = {
  storage: {
    backend: 'disk',
    basepath: '.'
  },
  initialize: function() {
    this._storageBackend = backends[this.storage.backend](this.namespace);
  },
  sync: function(method, model, options) {
    this._storageBackend.exec(method, model, options);
  }
};
