const Model = require('ampersand-model');
const storageMixin = require('storage-mixin');
const semver = require('semver');
const isEmpty = require('lodash.isempty');
const get = require('lodash.get');

let electronApp;
try {
  electronApp = require('@electron/remote').app;
} catch (e) {
  /* eslint no-console: 0 */
  console.log('Could not load @electron/remote', e.message);
}

const debug = require('debug')('mongodb-compass:models:preferences');

const THEMES = {
  DARK: 'DARK',
  LIGHT: 'LIGHT',
  OS_THEME: 'OS_THEME'
};

const preferencesProps = {
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

class Preferences {
  constructor() {
    this.userPreferencesModel = new PreferencesModel();
  }

  fetchPreferences() {
    return new Promise((resolve, reject) => {
      this.userPreferencesModel.fetch({
        success: (model) => {
          debug('fetch user preferences is successful', model.serialize());

          if (electronApp) {
            const userPreferencesAttributes = model.getAttributes({ props: true, derived: true });
            const oldVersion = get(userPreferencesAttributes, 'lastKnownVersion', '0.0.0');
            const attributes = {};
            const appVersion = electronApp.getVersion();
            if (semver.lt(oldVersion, appVersion) || process.env.SHOW_TOUR) {
              attributes.showFeatureTour = oldVersion;
            }
            if (semver.neq(oldVersion, appVersion)) {
              attributes.lastKnownVersion = appVersion;
            }
            if (!isEmpty(attributes)) {
              debug('userPreferences updated after fetch', attributes);
              model.save(attributes);
            }
          }

          return resolve();
        },
        error: (model, err) => {
          debug('fetch user preferences failed', err.message);
          return reject(err);
        }
      });
    });
  }

  savePreferences(attributes) {
    return new Promise((resolve, reject) => {
      if (attributes && !isEmpty(attributes)) {
        this.userPreferencesModel.save(attributes, {
          success: () => {
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

  getPreferenceValue(preferenceName) {
    const prefs = this.userPreferencesModel.getAttributes({ props: true, derived: true });
    return prefs[preferenceName];
  }

  async getConfigurableUserPreferences() {
    // Set the defaults and also update showedNetworkOptIn flag.
    if (!this.getPreferenceValue('showedNetworkOptIn')) {
      await this.savePreferences({
        autoUpdates: true,
        enableMaps: true,
        trackErrors: true,
        trackUsageStatistics: true,
        enableFeedbackPanel: true,
        showedNetworkOptIn: true
      });
    }

    const prefs = this.userPreferencesModel.getAttributes({ props: true, derived: true });

    return Object.fromEntries(
      Object.keys(prefs).filter((key) => preferencesProps[key].ui === true)
    );
  }

  onPreferenceChanged(preferenceName, callback) {
    const changeEvent = `change:${preferenceName}`;

    this.userPreferencesModel.listenToAndRun(this.userPreferencesModel, changeEvent, () => {
      return callback();
    });
  }
}

module.exports = Preferences;
module.exports.preferences = new Preferences();
module.exports.THEMES = THEMES;
