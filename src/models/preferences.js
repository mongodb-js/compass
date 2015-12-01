var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');
var pkg = require('../../package.json');
var _ = require('lodash');
var format = require('util').format;

var Preferences = Model.extend(storageMixin, {
  idAttribute: 'id',
  namespace: 'Preferences',
  storage: {
    backend: 'local',
    appName: pkg.product_name
  },
  props: {
    /**
     * String identifier for this set of preferences. Default is `General`.
     * @type {String}
     */
    id: {
      type: 'string',
      default: 'General',
      required: true
    },
    /**
     * Stores the last version compass was run as, e.g. `1.0.5`
     * @type {String}
     */
    lastKnownVersion: {
      type: 'string',
      required: false
    },
    /**
     * Stores a unique anonymous user ID (uuid) for the current user
     * @type {String}
     */
    currentUserId: {
      type: 'string',
      required: true,
      default: ''
    },

    /**
     * Feature Flags
     */

    /** Master switch to disable all network traffic, which includes
     * - Google maps
     * - Bugsnag
     * - Intercom
     * - Google Analytics
     * - Auto-updates
     * @type {Boolean}
     */
    networkTraffic: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable google maps rendering
     * @type {Boolean}
     */
    googleMaps: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable Bugsnag
     * @type {Boolean}
     */
    bugsnag: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable Intercom
     * @type {Boolean}
     */
    intercom: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable Google Analytics
     * @type {Boolean}
     */
    googleAnalytics: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable automatic updates
     * @type {Boolean}
     */
    autoUpdates: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to anable/disable keychain storage (via the keytar module).
     *
     * Warning: currently, this will break connecting to authenticated
     * connection where a password is required, because it will be lost
     * between Connect and Schema window.
     *
     * @type {Boolean}
     */
    keychainStorage: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable the graphical query builder code
     * @type {Boolean}
     */
    queryBuilder: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switches to enable/disable various authentication types
     * @type {Boolean}
     */
    authWithSSL: {
      type: 'boolean',
      required: true,
      default: false
    },
    authWithKerberos: {
      type: 'boolean',
      required: true,
      default: false
    },
    authWithLDAP: {
      type: 'boolean',
      required: true,
      default: false
    },
    authWithX509: {
      type: 'boolean',
      required: true,
      default: false
    }
  },
  /**
   * returns whether or not a given feature is enabled. In most cases, it just
   * passes through whatever property is asked for, but some checks are more
   * complex, like the `disableNetworkTraffic` master switch, which overwrites
   * other feature flags.
   *
   * @param  {String} feature    check for this feature
   * @return {Boolean}           enabled = true, disabled = false
   *
   * @example
   * ```
   * app.preferences.isFeatureEnabled('authWithKerberos')
   * ```
   * returns either true or false
   */
  isFeatureEnabled: function(feature) {
    // master network switch overwrites all network related features
    if (['googleMaps', 'bugsnag', 'intercom',
      'googleAnalytics', 'autoUpdates'].indexOf(feature) !== -1) {
      return this.networkTraffic && _.get(this, feature);
    }
    var res = _.get(this, feature, null);
    // don't allow asking for unknown features to prevent bugs
    if (res === null) {
      throw new Error(format('Feature %s unknown.', feature));
    }
    return res;
  }
});

module.exports = Preferences;
