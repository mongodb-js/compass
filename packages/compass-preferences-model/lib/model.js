const Model = require('ampersand-model');
const storageMixin = require('storage-mixin');
const get = require('lodash.get');
const format = require('util').format;
const _ = require('lodash');
const semver = require('semver');
const { ipcRenderer } = require('hadron-ipc');

var electronApp;
var APP_VERSION = '';
try {
  electronApp = require('@electron/remote').app;
  APP_VERSION = electronApp.getVersion();
} catch (e) {
  /* eslint no-console: 0 */
  console.log('Could not load @electron/remote', e.message);
}

var debug = require('debug')('mongodb-compass:models:preferences');

var THEMES = {
  DARK: 'DARK',
  LIGHT: 'LIGHT',
  OS_THEME: 'OS_THEME'
};

var preferencesProps = {
  /**
   * String identifier for this set of preferences. Default is `General`.
   * @type {String}
   */
  id: {
    type: 'string',
    default: 'General',
    required: true,
    ui: false,
    cli: false,
    globalConfig: false
  },
  /**
   * Stores the last version compass was run as, e.g. `1.0.5`
   * @type {String}
   */
  lastKnownVersion: {
    type: 'string',
    required: false,
    ui: true,
    cli: true,
    globalConfig: true
  },
  /**
   * Stores whether or not the feature tour should be presented to the
   * user. This is set in the migration step (./migrations/index.js).
   * @type {Boolean}
   */
  showFeatureTour: {
    type: 'string',
    required: false,
    default: undefined,
    ui: true,
    cli: true,
    globalConfig: true
  },
  /**
   * Stores whether or not the network opt-in screen has been shown to
   * the user already.
   * @type {String}
   */
  showedNetworkOptIn: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    globalConfig: true
  },
  /**
   * Stores the theme preference for the user.
   * @type {String}
   */
  theme: {
    type: 'string',
    required: true,
    default: THEMES.LIGHT,
    ui: true,
    cli: true,
    globalConfig: true
  },
  /**
   * Stores a unique MongoDB ID for the current user.
   * Initially, we used this field as telemetry user identifier,
   * but this usage is being deprecated.
   * The telemetryAnonymousId should be used instead.
   * @type {String}
   */
  currentUserId: {
    type: 'string',
    required: false,
    ui: false,
    cli: false,
    globalConfig: false
  },
  /**
   * Stores a unique telemetry anonymous ID (uuid) for the current user.
   * @type {String}
   */
  telemetryAnonymousId: {
    type: 'string',
    required: true,
    default: '',
    ui: false,
    cli: false,
    globalConfig: false
  },

  networkTraffic: {
    type: 'boolean',
    required: true,
    default: true,
    ui: true,
    cli: true,
    globalConfig: true
  },
  /**
   * Switch to enable/disable maps rendering
   * @type {Boolean}
   */
  enableMaps: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    globalConfig: true
  },
  /**
   * Switch to enable/disable error reports
   * @type {Boolean}
   */
  trackErrors: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    globalConfig: true
  },
  /**
   * Switch to enable/disable Intercom panel (renamed from `intercom`)
   * @type {Boolean}
   */
  enableFeedbackPanel: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    globalConfig: true
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
    default: false,
    ui: true,
    cli: true,
    globalConfig: true
  },
  /**
   * Switch to enable/disable automatic updates
   *
   * @type {Boolean}
   */
  autoUpdates: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    globalConfig: true
  }
};

const PreferencesModel = Model.extend(storageMixin, {
  props: preferencesProps,
  extraProperties: 'ignore',
  idAttribute: 'id',
  namespace: 'AppPreferences',
  storage: {
    backend: 'disk',
    basepath: electronApp ? electronApp.getPath('userData') : undefined
  }
});

let globalPreferences = {};
let cliPreferences = {};

class Preferences {
  constructor() {
    const userPreferences = new PreferencesModel();

    this.getUserPreferences = function() { return userPreferences; };
    this.getGlobalPreferences = function() { return globalPreferences; };
    this.getCliPreferences = function() { return cliPreferences; };
  }

  async getPreferencesFromSetup() {
    const ipcRendererResult = await ipcRenderer.invoke('compass:setup-preferences');

    globalPreferences = ipcRendererResult.globalPreferences;
    cliPreferences = ipcRendererResult.cliPreferences;
  }

  refreshPreferences() {
    const user = this.getUserPreferences().getAttributes({ props: true, derived: true });
    const cli = this.getCliPreferences();
    const global = this.getGlobalPreferences();
    Object.assign(this, { ...user, ...cli, ...global });
  }

  fetch() {
    this.getPreferencesFromSetup();

    return new Promise((resolve, reject) => {
      this.getUserPreferences().fetch({
        success: (model) => {
          debug('userPreferences fetch successful', model.serialize());

          const userPreferencesAttributes = model.getAttributes({ props: true, derived: true });
          const oldVersion = _.get(userPreferencesAttributes, 'lastKnownVersion', '0.0.0');
          const attributes = {};

          if (
            semver.lt(oldVersion, APP_VERSION) ||
            // this is so we can test the tour modal in E2E tests where the version
            // is always the same
            process.env.SHOW_TOUR
          ) {
            attributes.showFeatureTour = oldVersion;
          }
          if (semver.neq(oldVersion, APP_VERSION)) {
            attributes.lastKnownVersion = APP_VERSION;
          }

          if (!_.isEmpty(attributes)) {
            debug('userPreferences updated after fetch', attributes);
            model.save(attributes);
          }

          this.refreshPreferences();

          return resolve();
        },
        error: (model, err) => {
          debug('fetching userPreferences error', err);
          return reject(err);
        }
      });
    });
  }

  save(attributes) {
    const userPreferences = this.getUserPreferences();

    return new Promise((resolve, reject) => {
      if (attributes && !_.isEmpty(attributes)) {
        userPreferences.save(attributes, {
          success: (model) => {
            debug('userPreferences saved', model.serialize());
            this.refreshPreferences();
            return resolve();
          },
          error: (model, err) => {
            debug('saving userPreferences error', err);
            return reject(err);
          }
        });
      }
    });
  }

  isFeatureEnabled(feature) {
    // main network switch overwrites all network related features
    if (['enableMaps', 'trackErrors', 'enableFeedbackPanel', 'trackUsageStatistics', 'autoUpdates'].indexOf(feature) !== -1) {
      return this.networkTraffic && process.env.HADRON_ISOLATED !== 'true' && get(this, feature);
    }
    const res = get(this, feature, null);
    // don't allow asking for unknown features to prevent bugs
    if (res === null) {
      throw new Error(format('Feature %s unknown.', feature));
    }
    return res;
  }

  isUIConfigurable(key) {
    return !(
      !(key in this.getGlobalPreferences()) &&
      !(key in this.cliPreferences()) &&
      preferencesProps[key].ui
    );
  }
}

module.exports = Preferences;
module.exports.preferences = new Preferences();
module.exports.THEMES = THEMES;
