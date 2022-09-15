import storageMixin from 'storage-mixin';
import pickBy from 'lodash.pickby';
import { promisifyAmpersandMethod } from '@mongodb-js/compass-utils';
import type { AmpersandMethodOptions } from '@mongodb-js/compass-utils';
import createDebug from 'debug';
import type { ParsedGlobalPreferencesResult } from './global-config';

const debug = createDebug('mongodb-compass:models:preferences');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Model = require('ampersand-model');

export enum THEMES {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  OS_THEME = 'OS_THEME',
}

export type UserConfigurablePreferences = {
  // User-facing preferences
  autoUpdates: boolean;
  enableMaps: boolean;
  trackErrors: boolean;
  trackUsageStatistics: boolean;
  enableFeedbackPanel: boolean;
  networkTraffic: boolean;
  theme: THEMES;
};

export type InternalUserPreferences = {
  // These are internally used preferences that are not configurable
  // by users.
  showedNetworkOptIn: boolean; // Has the settings dialog has been shown before.
  id: string;
  lastKnownVersion: string;
  currentUserId: string;
  telemetryAnonymousId: string;
};

// UserPreferences contains all preferences stored to disk in the
// per-user preferences model (currently the Ampersand model).
export type UserPreferences = UserConfigurablePreferences &
  InternalUserPreferences;

export type CliOnlyPreferences = {
  exportConnections?: string;
  importConnections?: string;
  passphrase?: string;
  version?: boolean;
  help?: boolean;
};

export type NonUserPreferences = {
  ignoreAdditionalCommandLineFlags?: boolean;
};

export type GlobalPreferences = UserPreferences &
  CliOnlyPreferences &
  NonUserPreferences;

type OnPreferencesChangedCallback = (
  changedPreferencesValues: Partial<GlobalPreferences>
) => void;

declare class PreferencesAmpersandModel {
  fetch: () => void;
  save: (
    attributes?: AmpersandMethodOptions<void>,
    options?: AmpersandMethodOptions<void>
  ) => void;
  getAttributes: (options?: {
    props?: boolean;
    derived?: boolean;
  }) => UserPreferences;
}

export type AmpersandType<T> = T extends string
  ? 'string'
  : T extends boolean
  ? 'boolean'
  : T extends number
  ? 'number'
  : T extends any[]
  ? 'array'
  : T extends Date
  ? 'date'
  : T extends object
  ? 'object'
  : never;

type PreferenceDefinition<K extends keyof GlobalPreferences> = {
  type: AmpersandType<GlobalPreferences[K]>;
  default?: GlobalPreferences[K];
  required: boolean;
  ui: K extends keyof UserConfigurablePreferences ? true : false;
  cli: K extends keyof InternalUserPreferences
    ? false
    : K extends keyof CliOnlyPreferences
    ? true
    : boolean;
  global: K extends keyof InternalUserPreferences
    ? false
    : K extends keyof CliOnlyPreferences
    ? false
    : boolean;
};

const modelPreferencesProps: Required<{
  [K in keyof UserPreferences]: PreferenceDefinition<K>;
}> = {
  /**
   * String identifier for this set of preferences. Default is `General`.
   */
  id: {
    type: 'string',
    default: 'General',
    required: true,
    ui: false,
    cli: false,
    global: false,
  },
  /**
   * Stores the last version compass was run as, e.g. `1.0.5`.
   */
  lastKnownVersion: {
    type: 'string',
    required: false,
    default: '0.0.0',
    ui: false,
    cli: false,
    global: false,
  },
  /**
   * Stores whether or not the network opt-in screen has been shown to
   * the user already.
   */
  showedNetworkOptIn: {
    type: 'boolean',
    required: true,
    default: false,
    ui: false,
    cli: false,
    global: false,
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
    global: true,
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
    global: false,
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
    global: false,
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
    global: true,
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
    global: true,
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
    global: true,
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
    global: true,
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
    global: true,
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
    global: true,
  },
};

const cliOnlyPreferencesProps: Required<{
  [K in keyof CliOnlyPreferences]: PreferenceDefinition<K>;
}> = {
  exportConnections: {
    type: 'string',
    required: false,
    ui: false,
    cli: true,
    global: false,
  },
  importConnections: {
    type: 'string',
    required: false,
    ui: false,
    cli: true,
    global: false,
  },
  passphrase: {
    type: 'string',
    required: false,
    ui: false,
    cli: true,
    global: false,
  },
  help: {
    type: 'boolean',
    required: false,
    ui: false,
    cli: true,
    global: false,
  },
  version: {
    type: 'boolean',
    required: false,
    ui: false,
    cli: true,
    global: false,
  },
};

const nonUserPreferences: Required<{
  [K in keyof NonUserPreferences]: PreferenceDefinition<K>;
}> = {
  ignoreAdditionalCommandLineFlags: {
    type: 'boolean',
    required: false,
    default: false,
    ui: false,
    cli: true,
    global: true,
  },
};

export const allPreferencesProps: Required<{
  [K in keyof GlobalPreferences]: PreferenceDefinition<K>;
}> = {
  ...modelPreferencesProps,
  ...cliOnlyPreferencesProps,
  ...nonUserPreferences,
};

export type PreferenceStateInformation = Partial<
  Record<keyof GlobalPreferences, 'set-cli' | 'set-global'>
>;

class Preferences {
  private _onPreferencesChangedCallbacks: OnPreferencesChangedCallback[];
  private _userPreferencesModel: PreferencesAmpersandModel;
  private _globalPreferences: {
    cli: Partial<GlobalPreferences>;
    global: Partial<GlobalPreferences>;
  };

  constructor(
    basepath?: string,
    globalPreferences?: Partial<ParsedGlobalPreferencesResult>
  ) {
    // User preferences are stored to disc via the Ampersand model.
    const PreferencesModel = Model.extend(storageMixin, {
      props: modelPreferencesProps,
      extraProperties: 'ignore',
      idAttribute: 'id',
      namespace: 'AppPreferences',
      storage: {
        backend: 'disk',
        basepath,
      },
    });

    this._onPreferencesChangedCallbacks = [];
    this._userPreferencesModel = new PreferencesModel();
    this._globalPreferences = {
      cli: {},
      global: {},
      ...globalPreferences,
    };
  }

  async fetchPreferences(): Promise<GlobalPreferences> {
    const userPreferencesModel = this._userPreferencesModel;

    // Fetch user preferences from the Ampersand model.
    const fetchUserPreferences = promisifyAmpersandMethod(
      userPreferencesModel.fetch.bind(userPreferencesModel)
    );

    try {
      await fetchUserPreferences();
    } catch (err) {
      // TODO: Log this error with @compass/logging.
      debug('Failed to load preferences, error while fetching models', {
        message: (err as Error).message,
      });
    }

    return this.getPreferences();
  }

  async savePreferences(
    attributes: Partial<UserPreferences> = {}
  ): Promise<GlobalPreferences> {
    const keys = Object.keys(attributes) as (keyof UserPreferences)[];
    if (keys.length === 0) {
      return this.getPreferences();
    }

    const invalidKey = keys.find((key) => !modelPreferencesProps[key]);
    if (invalidKey !== undefined) {
      // Guard against accidentally saving non-model settings here.
      throw new Error(
        `Setting "${invalidKey}" is not part of the preferences model`
      );
    }

    const userPreferencesModel = this._userPreferencesModel;

    // Save user preferences to the Ampersand model.
    const saveUserPreferences: (
      attributes: Partial<UserPreferences>
    ) => Promise<void> = promisifyAmpersandMethod(
      userPreferencesModel.save.bind(userPreferencesModel)
    );

    try {
      await saveUserPreferences(attributes);
    } catch (err) {
      // TODO: Log this error with @compass/logging.
      debug('Failed to save preferences, error while saving models', {
        message: (err as Error).message,
      });
    }

    const savedPreferencesValues = this.getPreferences();
    const changedPreferencesValues = pickBy(
      savedPreferencesValues,
      (value, key) => Object.keys(attributes).includes(key)
    );
    this._callOnPreferencesChanged(changedPreferencesValues);

    return this.getPreferences();
  }

  getPreferences(): GlobalPreferences {
    return {
      ...this._userPreferencesModel.getAttributes({
        props: true,
        derived: true,
      }),
      ...this._globalPreferences.cli,
      ...this._globalPreferences.global,
    };
  }

  async getConfigurableUserPreferences(): Promise<UserConfigurablePreferences> {
    // Set the defaults and also update showedNetworkOptIn flag.
    if (!this.getPreferences().showedNetworkOptIn) {
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
    const preferences = this.getPreferences();
    return Object.fromEntries(
      Object.entries(preferences).filter(
        ([key]) =>
          allPreferencesProps[key as keyof typeof preferences].ui === true
      )
    ) as UserConfigurablePreferences;
  }

  getPreferenceStates(): PreferenceStateInformation {
    const preferenceState: Partial<Record<string, 'set-cli' | 'set-global'>> =
      {};
    for (const key of Object.keys(this._globalPreferences.cli))
      preferenceState[key] = 'set-cli';
    for (const key of Object.keys(this._globalPreferences.global))
      preferenceState[key] = 'set-global';
    return preferenceState;
  }

  _callOnPreferencesChanged(
    changedPreferencesValues: Partial<GlobalPreferences>
  ): void {
    for (const callback of this._onPreferencesChangedCallbacks) {
      return callback(changedPreferencesValues);
    }
  }

  onPreferencesChanged(callback: OnPreferencesChangedCallback): void {
    this._onPreferencesChangedCallbacks.push(callback);
  }
}

export default Preferences;
