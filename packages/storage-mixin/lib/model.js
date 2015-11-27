var Model = require('ampersand-model');
var format = require('util').format;

var localSync = require('./sync/local')('org.company.product.settings');

var debug = require('debug')('app-preferences:model');

// @todo make sync method wrapper to use `this.storage` layer.
// var localSync = new Metadata('com.mongodb.compass.Preference');

/**
 * Preference model, that holds a single preference.
 */
var Preference = Model.extend({
  idAttribute: 'key',
  props: {
    /**
     * the key of the preference, must be unique across all preferences
     *
     * @type {String}
     */
    key: {
      type: 'string',
      required: true,
      default: ''
    },
    /**
     * the value of the preference. Can be any type, including null/undefined.
     *
     * @type {Any}
     */
    value: {
      type: 'any',
      required: false,
      default: null
    },
    /**
     * The default value for the preference.
     *
     * Preferences with resetOnAppLaunch:true will restore their default value
     * on each application launch.
     *
     * Preferences with resetOnAppVersionChange:true will restore their default
     * value on application launch when a different version is detected.
     *
     * @type {Any}
     */
    default: {
      type: 'any',
      required: false,
      default: null
    },
    /**
     * A section under which this preference is listed, e.g. in a preference
     * pane. Not currently used.
     *
     * @type {String}
     */
    section: {
      type: 'string',
      required: true,
      default: 'General'
    },
    /**
     * if this property is true, the preference resets to its default value
     * every time the app is started.
     *
     * @type {Boolean}
     */
    resetOnAppLaunch: {
      type: 'boolean',
      required: true,
      default: true
    },
    /**
     * if this property is true, the preference resets to its default value
     * every time the app is started and a different version is detected.
     * It compares the app.meta['App Version'] value with
     * preferences.lastKnownVersion.
     *
     * @type {Boolean}
     */
    resetOnAppVersionChange: {
      type: 'boolean',
      required: true,
      default: true
    },
    /**
     * hides the preference from any user-facing elements. The preference can
     * only be changed programatically or by directly manipulating the storage
     * layer.
     *
     * @type {Boolean}
     */
    hidden: {
      type: 'boolean',
      required: true,
      default: false
    }
  },
  session: {
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
    storage: {
      type: 'string',
      default: 'memory',
      values: ['local', 'keychain', 'memory', 'disk', 'remote'],
      required: true
    }
  },
  initialize: function() {
    // check if preference props are compatible with storage choice
    // @todo automatically choose storage layer based on preference name,
    // `resetOn*` choices, etc.
    if (this.resetOnAppLaunch === false) {
      if (this.storage === 'memory') {
        throw new Error(format('Preference %s should not reset on App '
          + 'launch. This is not possible with `%s` storage layer.',
          this.key, this.storage));
      }
    }
    if (this.resetOnAppVersionChange === false) {
      if (['memory', 'local'].indexOf(this.storage) !== -1) {
        throw new Error(format('Preference %s should not reset on App '
          + 'version change. This is not possible with `%s` storage layer.',
          this.key, this.storage));
      }
    }
  },
  sync: function(method, model, options) {
    debug('using `%s` storage layer for method `%s`', model.storage, method);
    switch (model.storage) {
      case 'local':
        localSync.exec(method, model, options);
        break;
      default:
        debug('`%s` storage layer not implemented.', model.storage);
        return
    }
  }
});

module.exports = Preference;
