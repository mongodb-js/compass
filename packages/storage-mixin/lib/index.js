var backends = require('./backends');
// var debug = require('debug')('storage-mixin');

/**
 * storage-mixin
 *
 * Use this mixin with Ampersand models and collections to easily persist
 * them to a number of different storage backends.
 *
 * @example
 * var storageMixin = require('storage-mixin');
 * var StorableModel = MyModel.extend(storageMixin, {
 *   storage: {
 *     backend: 'disk',
 *     basepath: '/tmp'
 *   }
 * });
 *
 * Now you can call call the `.save()` method on instantiated models.
 *
 * @example
 * var model = new StorableModel();
 * model.save({id: 1, name: 'thomas'});
 *
 * Additional options can be passed to storage backends via the `storage`
 * object. The `backend` key is always required and decides which backend
 * to use. All other keys are optional and backend-dependent.
 *
 * Backends
 *
 * The following backends are currently supported: `local`, `disk`, `null`,
 * default is `local`.
 *
 * - Backend: `disk`
 *
 * Stores objects as .json files in <basepath>/<namespace>/<id>.json
 * @param {String} basepath   base path for file storage, default: `.`
 *
 *
 * - Backend: `local`
 *
 * Stores objects in local storage of the browser. The IndexedDB, localStorage
 * and WebSQL drivers are supported via the `localforage` npm module.
 * @param {String} driver    the driver to be passed on to localforage, one
 *                           of `INDEXEDDB`, `LOCALSTORAGE` or `WEBSQL`,
 *                           default: `INDEXEDDB`.
 *
 * - Backend: `null`
 *
 * Does not store anything but will return with successful callback on all
 * method calls. For reads, it will return an empty object {} for models,
 * or an empty array [] for collections.
 */
module.exports = {
  storage: {
    backend: 'disk',
    basepath: '.'
  },
  initialize: function() {
    this.storage.namespace = this.namespace;
    this._storageBackend = new backends[this.storage.backend](this.storage);
  },
  sync: function(method, model, options) {
    this._storageBackend.exec(method, model, options);
  }
};
