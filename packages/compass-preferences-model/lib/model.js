const Model = require('ampersand-model');
const storageMixin = require('storage-mixin');
const isEmpty = require('lodash.isempty');
const ipc = require('hadron-ipc');

const debug = require('debug')('mongodb-compass:models:preferences');

const THEMES = {
  DARK: 'DARK',
  LIGHT: 'LIGHT',
  OS_THEME: 'OS_THEME'
};

const preferencesProps = {
  /**
   * String identifier for this set of preferences. Default is `General`.
   */
  id: {
    type: 'string',
    default: 'General',
    required: true,
    ui: false,
    cli: false,
    global: false
  },
  /**
   * Stores the last version compass was run as, e.g. `1.0.5`.
   */
  lastKnownVersion: {
    type: 'string',
    required: false,
    ui: false,
    cli: true,
    global: true
  },
  /**
   * Stores whether or not the feature tour should be presented to the
   * user. This is set in the migration step (./migrations/index.js).
   */
  showFeatureTour: {
    type: 'string',
    required: false,
    ui: true,
    cli: true,
    global: true
  },
  /**
   * Stores whether or not the network opt-in screen has been shown to
   * the user already.
   */
  showedNetworkOptIn: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    global: true
  },
  /**
   * Stores the theme preference for the user.
   */
  theme: {
    type: 'string',
    required: true,
    default: THEMES.LIGHT,
    ui: true,
    cli: true,
    global: true
  },
  /**
   * Stores a unique MongoDB ID for the current user.
   * Initially, we used this field as telemetry user identifier,
   * but this usage is being deprecated.
   * The telemetryAnonymousId should be used instead.
   */
  currentUserId: {
    type: 'string',
    required: false,
    ui: false,
    cli: false,
    global: false
  },
  /**
   * Stores a unique telemetry anonymous ID (uuid) for the current user.
   */
  telemetryAnonymousId: {
    type: 'string',
    required: true,
    default: '',
    ui: false,
    cli: false,
    global: false
  },
  /**
   * Master switch to disable all network traffic
   * and make Compass behave like Isolated edition always,
   * i.e. no network traffic other than the one to the db server
   * (which includes maps, telemetry, auto-updates).
   */
  networkTraffic: {
    type: 'boolean',
    required: true,
    default: true,
    ui: true,
    cli: true,
    global: true
  },
  /**
   * Switch to enable/disable maps rendering.
   */
  enableMaps: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    global: true
  },
  /**
   * Switch to enable/disable error reports.
   */
  trackErrors: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    global: true
  },
  /**
   * Switch to enable/disable Intercom panel (renamed from `intercom`).
   */
  enableFeedbackPanel: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    global: true
  },
  /**
   * Switch to enable/disable usage statistics collection
   * (renamed from `googleAnalytics`).
   */
  trackUsageStatistics: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    global: true
  },
  /**
   * Switch to enable/disable automatic updates.
   */
  autoUpdates: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    global: true
  }
};

class Preferences {
  constructor(userDataPath) {
    // User preferences are stored to disc via the Ampersand model.
    const PreferencesModel = Model.extend(storageMixin, {
      props: preferencesProps,
      extraProperties: 'ignore',
      idAttribute: 'id',
      namespace: 'AppPreferences',
      storage: {
        backend: 'disk',
        basepath: userDataPath // userDataPath of the electron app.
      }
    });

    this.userPreferencesModel = new PreferencesModel();
  }

  fetchPreferences() {
    return new Promise((resolve, reject) => {
      // Fetch user preferences from the Ampersand model.
      this.userPreferencesModel.fetch({
        success: (model) => {
          debug('fetch user preferences is successful', model.serialize());
          return resolve(this.getAllPreferences());
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
        // Save user preferences to the Ampersand model.
        this.userPreferencesModel.save(attributes, {
          success: () => {
            return resolve(this.getAllPreferences());
          },
          error: (model, err) => {
            debug('saving user preferences error', err);
            return reject(err);
          }
        });
      }
    });
  }

  getAllPreferences() {
    // TODO: merge user, global, and CLI preferences here.
    return this.userPreferencesModel.getAttributes({ props: true, derived: true });
  }

  async getConfigurableUserPreferences() {
    // Set the defaults and also update showedNetworkOptIn flag.
    if (!this.getAllPreferences().showedNetworkOptIn) {
      await this.savePreferences({
        autoUpdates: true,
        enableMaps: true,
        trackErrors: true,
        trackUsageStatistics: true,
        enableFeedbackPanel: true,
        showedNetworkOptIn: true,
        theme: THEMES.LIGHT,
      });
    }
    const preferences = this.getAllPreferences();
    return Object.fromEntries(
      Object.entries(preferences).filter(([key]) => preferencesProps[key].ui === true)
    );
  }
}

/**
 * API to communicate with preferences from the electron renderer process.
 */
const preferencesIpc = {
  savePreferences(attributes) {
    if (ipc && ipc.ipcRenderer && typeof ipc.ipcRenderer.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:save-preferences', attributes);
    }
  },
  getPreferences() {
    if (ipc && ipc.ipcRenderer && typeof ipc.ipcRenderer.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:get-all-preferences');
    }
  },
  getConfigurableUserPreferences() {
    if (ipc && ipc.ipcRenderer && typeof ipc.ipcRenderer.invoke === 'function') {
      return ipc.ipcRenderer.invoke('compass:get-configurable-user-preferences');
    }
  },
  onPreferencesChanged(callback) {
    if (ipc && ipc.ipcRenderer && typeof ipc.ipcRenderer.on === 'function') {
      ipc.ipcRenderer.on('compass:preferences-changed', (_, preferences) => {
        callback(preferences);
      });
    }
  }
};

module.exports = Preferences;
module.exports.preferencesIpc = preferencesIpc;
module.exports.THEMES = THEMES;
