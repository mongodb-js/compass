var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');
var _ = require('lodash');
var format = require('util').format;
var electronApp = require('electron').remote.app;
var debug = require('debug')('mongodb-compass:models:preferences');

var Preferences = Model.extend(storageMixin, {
  extraProperties: 'ignore',
  idAttribute: 'id',
  namespace: 'AppPreferences',
  storage: {
    backend: 'disk',
    basepath: electronApp.getPath('userData')
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
     * Stores whether or not the feature tour should be presented to the
     * user. This is set in the migration step (./migrations/index.js).
     * @type {Boolean}
     */
    showFeatureTour: {
      type: 'string',
      required: false,
      default: undefined
    },
    /**
     * Stores whether or not the network opt-in screen has been shown to
     * the user already.
     * @type {String}
     */
    showedNetworkOptIn: {
      type: 'boolean',
      required: true,
      default: false
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
      default: true
    },
    /**
     * Switch to enable/disable special treasure hunt features for
     * MongoDB World 2016. This flag should never get saved as "true" to
     * the preference file. It should only be set to true temporarily while
     * connected to our special treasure hunt data server.
     * @type {Boolean}
     */
    treasureHunt: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable maps rendering
     * @type {Boolean}
     */
    enableMaps: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable error reports (renamed from `bugsnag`)
     * @type {Boolean}
     */
    trackErrors: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable Intercom panel (renamed from `intercom`)
     * @type {Boolean}
     */
    enableFeedbackPanel: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable usage statistics collection
     * (renamed from `googleAnalytics`)
     *
     * @type {Boolean}
     */
    trackUsageStatistics: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable automatic updates
     *
     * @type {Boolean}
     */
    autoUpdates: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switch to enable/disable showing the update banner notification, this
     * is independent of the autoUpdates flag and will not prevent checking for
     * and downloading the new versions.
     *
     * @type {Boolean}
     */
    showAutoUpdateBanner: {
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
      default: true
    },
    /**
     * Switch to enable/disable the "Explain Plan" tab on the collection level
     * @type {Boolean}
     */
    showExplainPlanTab: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Allow single document CRUD.
     */
    singleDocumentCrud: {
      type: 'boolean',
      required: true,
      default: false
    },
    /**
     * Switches to enable/disable various authentication / ssl types
     *
     * Warning: currently not hooked into the code, see INT-859.
     *
     * @type {Boolean}
     */
    authMongodb: {
      type: 'boolean',
      required: true,
      default: true
    },
    authKerberos: {
      type: 'boolean',
      required: true,
      default: true
    },
    authLdap: {
      type: 'boolean',
      required: true,
      default: true
    },
    authX509: {
      type: 'boolean',
      required: true,
      default: false
    },
    sslUnvalidated: {
      type: 'boolean',
      required: true,
      default: true
    },
    sslServer: {
      type: 'boolean',
      required: true,
      default: true
    },
    sslAll: {
      type: 'boolean',
      required: true,
      default: true
    }
  },
  initialize: function() {
    this.on('page-refresh', this.onPageRefresh.bind(this));
    this.on('app-restart', this.onAppRestart.bind(this));
    this.on('app-version-mismatch', this.onAppVersionMismatch.bind(this));
  },
  onPageRefresh: function() {
    debug('app page refresh detected');
  },
  onAppRestart: function() {
    debug('app restart detected');
  },
  onAppVersionMismatch: function(lastKnownVersion, currentVersion) {
    debug('version mismatch detected: was %s, now %s',
      lastKnownVersion, currentVersion);
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
   * app.isFeatureEnabled('authWithKerberos')
   * ```
   * returns either true or false
   */
  isFeatureEnabled: function(feature) {
    // INT-1610 force maps off until we have a MapBox commercial license
    if (feature === 'enableMaps') {
      return false;
    }

    // master network switch overwrites all network related features
    if (['enableMaps', 'trackErrors', 'enableFeedbackPanel',
      'trackUsageStatistics', 'autoUpdates'].indexOf(feature) !== -1) {
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
