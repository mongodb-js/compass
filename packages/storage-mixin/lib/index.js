var syncLayers = require('./sync');
// var debug = require('debug')('storage-mixin');

/**
 * The storage layer this preference should use.
 *
 * local         persist using the localforage module, e.g. localStorage,
 *               indexedDB, etc. Use this storage for non-sensitive
 *               information, that will reset on app upgrades.
 * keychain      persist using the keytar module. Sensitive information
 *               like passwords need to use this storage layer.
 * memory        preference is only held in memory and not persisted. Use
 *               this storage layer for hard-coded preferences that will
 *               not change for a specific app version.
 * disk          @todo persist to a file on disk. Preferences that need to
 *               survive a new installation / upgrade of the app need to
 *               use this storage option.
 * remote        @todo load the preference from a remote server.
 *
 * @type {String}
 */
module.exports = {
  storage: 'none',
  initialize: function() {
    this._synclayer = syncLayers[this.storage](this.namespace);
  },
  sync: function(method, model, options) {
    this._synclayer.exec(method, model, options);
  }
};
