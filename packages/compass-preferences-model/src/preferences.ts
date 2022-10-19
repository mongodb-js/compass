import storageMixin from 'storage-mixin';
import { promisifyAmpersandMethod } from '@mongodb-js/compass-utils';
import type { AmpersandMethodOptions } from '@mongodb-js/compass-utils';
import type { ParsedGlobalPreferencesResult } from './global-config';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-PREFERENCES');

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
  readOnly: boolean;
  enableShell: boolean;
  theme: THEMES;
};

export type InternalUserPreferences = {
  // These are internally used preferences that are not configurable
  // by users.
  showedNetworkOptIn: boolean; // Has the settings dialog been shown before.
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
  positionalArguments?: string[];
  file?: string;
};

export type AllPreferences = UserPreferences &
  CliOnlyPreferences &
  NonUserPreferences;

type OnPreferencesChangedCallback = (
  changedPreferencesValues: Partial<AllPreferences>
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

type PreferenceDefinition<K extends keyof AllPreferences> = {
  /** The type of the preference value, in Ampersand naming */
  type: AmpersandType<AllPreferences[K]>;
  /** An optional default value for the preference */
  default?: AllPreferences[K];
  /** Whether the preference is required in the Ampersand model */
  required: boolean;
  /** Whether the preference can be modified through the Settings UI */
  ui: K extends keyof UserConfigurablePreferences ? true : false;
  /** Whether the preference can be set on the command line */
  cli: K extends 'showedNetworkOptIn'
    ? boolean
    : K extends keyof InternalUserPreferences
    ? false
    : K extends keyof CliOnlyPreferences
    ? true
    : boolean;
  /** Whether the preference can be set in the global config file */
  global: K extends keyof InternalUserPreferences
    ? false
    : K extends keyof CliOnlyPreferences
    ? false
    : boolean;
  /** A description used for the --help text and the Settings UI */
  description: K extends keyof InternalUserPreferences
    ? null
    : { short: string; long?: string };
  /** A method for deriving the current semantic value of this option, even if it differs from the stored value */
  deriveValue?: DeriveValueFunction<AllPreferences[K]>;
};

type DeriveValueFunction<T> = (
  /** Get a preference's value from the current set of preferences */
  getValue: <K extends keyof AllPreferences>(key: K) => AllPreferences[K],
  /** Get a preference's state from the current set of preferences */
  getState: <K extends keyof AllPreferences>(key: K) => PreferenceState
) => { value: T; state: PreferenceState };

/** Helper for defining how to derive value/state for networkTraffic-affected preferences */
function deriveNetworkTrafficOptionState<K extends keyof AllPreferences>(
  property: K
): DeriveValueFunction<boolean> {
  return (v, s) => ({
    value: v(property) && v('networkTraffic'),
    state:
      s(property) ??
      s('networkTraffic') ??
      (v('networkTraffic') ? undefined : 'derived'),
  });
}

/** Helper for defining how to derive value/state for readOnly-affected preferences */
function deriveReadOnlyOptionState<K extends keyof AllPreferences>(
  property: K
): DeriveValueFunction<boolean> {
  return (v, s) => ({
    value: v(property) && v('readOnly'),
    state:
      s(property) ??
      s('readOnly') ??
      (v('readOnly') ? undefined : 'derived'),
  });
}

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
    description: null,
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
    description: null,
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
    cli: true,
    global: false,
    description: null,
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
    description: {
      short: 'Compass UI Theme',
    },
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
    description: null,
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
    description: null,
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
    description: {
      short: 'Enable network traffic other than to the MongoDB database',
    },
  },
  /**
   * Removes features that write to the database from the UI.
   */
   readOnly: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable Read-Only',
      long: 'Limit Compass strictly to read operations, with all write and delete capabilities removed.',
    },
  },
  /**
   * Switch to enable/disable the embedded shell.
   */
   enableShell: {
    type: 'boolean',
    required: true,
    default: false,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable MongoDB Shell',
      long: 'Allow Compass to interacting with MongoDB deployments via the embedded shell.',
    },
    deriveValue: deriveReadOnlyOptionState('enableShell'),
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
    description: {
      short: 'Enable Geographic Visualizations',
      long: 'Allow Compass to make requests to a 3rd party mapping service.',
    },
    deriveValue: deriveNetworkTrafficOptionState('enableMaps'),
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
    description: {
      short: 'Enable Crash Reports',
      long: 'Allow Compass to send crash reports containing stack traces and unhandled exceptions.',
    },
    deriveValue: deriveNetworkTrafficOptionState('trackErrors'),
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
    description: {
      short: 'Give Product Feedback',
      long: 'Enables a tool that our Product team can use to occasionally reach out for feedback about Compass.',
    },
    deriveValue: deriveNetworkTrafficOptionState('enableFeedbackPanel'),
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
    description: {
      short: 'Enable Usage Statistics',
      long: 'Allow Compass to send anonymous usage statistics.',
    },
    deriveValue: deriveNetworkTrafficOptionState('trackUsageStatistics'),
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
    description: {
      short: 'Enable Automatic Updates',
      long: 'Allow Compass to periodically check for new updates.',
    },
    deriveValue: deriveNetworkTrafficOptionState('autoUpdates'),
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
    description: {
      short: 'Export Favorite Connections',
      long: 'Export Compass favorite connections. Can be used with --passphrase.',
    },
  },
  importConnections: {
    type: 'string',
    required: false,
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Import Favorite Connections',
      long: 'Import Compass favorite connections. Can be used with --passphrase.',
    },
  },
  passphrase: {
    type: 'string',
    required: false,
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Connection Export/Import Passphrase',
      long: 'Specify a passphrase for encrypting/decrypting secrets.',
    },
  },
  help: {
    type: 'boolean',
    required: false,
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Show Compass Options',
    },
  },
  version: {
    type: 'boolean',
    required: false,
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Show Compass Version',
    },
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
    description: {
      short: 'Allow Additional CLI Flags',
      long: 'Allow specifying command-line flags that Compass does not understand, e.g. Electron or Chromium flags',
    },
  },
  positionalArguments: {
    type: 'array',
    required: false,
    ui: false,
    cli: true,
    global: false,
    description: {
      short:
        'Specify a Connection String or Connection ID to Automatically Connect',
    },
  },
  file: {
    type: 'string',
    required: false,
    ui: false,
    cli: true,
    global: true,
    description: {
      short: 'Specify a List of Connections for Automatically Connecting',
    },
  },
};

export const allPreferencesProps: Required<{
  [K in keyof AllPreferences]: PreferenceDefinition<K>;
}> = {
  ...modelPreferencesProps,
  ...cliOnlyPreferencesProps,
  ...nonUserPreferences,
};

export function getSettingDescription(
  name: Exclude<keyof AllPreferences, keyof InternalUserPreferences>
): { short: string; long?: string } {
  return allPreferencesProps[name].description;
}

export type PreferenceState =
  | 'set-cli'
  | 'set-global'
  | 'hardcoded'
  | 'derived'
  | undefined;

export type PreferenceStateInformation = Partial<
  Record<keyof AllPreferences, PreferenceState>
>;

export class Preferences {
  private _onPreferencesChangedCallbacks: OnPreferencesChangedCallback[];
  private _userPreferencesModel: PreferencesAmpersandModel;
  private _globalPreferences: {
    cli: Partial<AllPreferences>;
    global: Partial<AllPreferences>;
    hardcoded: Partial<AllPreferences>;
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
      hardcoded: {},
      ...globalPreferences,
    };

    if (Object.keys(this._globalPreferences.hardcoded).length > 0) {
      log.info(
        mongoLogId(1_001_000_159),
        'preferences',
        'Created Preferences object with hardcoded options',
        { options: this._globalPreferences.hardcoded }
      );
    }
  }

  /**
   * Load preferences from the user preference storage.
   * The return value also accounts for preferences set from other sources.
   *
   * @returns The currently active set of preferences.
   */
  async fetchPreferences(): Promise<AllPreferences> {
    const userPreferencesModel = this._userPreferencesModel;

    // Fetch user preferences from the Ampersand model.
    const fetchUserPreferences = promisifyAmpersandMethod(
      userPreferencesModel.fetch.bind(userPreferencesModel)
    );

    try {
      await fetchUserPreferences();
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_156),
        'preferences',
        'Failed to load preferences, error while fetching models',
        {
          error: (err as Error).message,
        }
      );
    }

    return this.getPreferences();
  }

  /**
   * Change preferences in the user's preference storage.
   * This method validates that the preference is one that is stored in the
   * underlying storage model. It does *not* validate that the preference
   * is one that the user is allowed to change, e.g. because it was overridden
   * through the global config file/command line, and it does *not* validate
   * whether the current value of the preference is affected by other
   * preference values.
   *
   * @param attributes One or more preferences to update.
   * @returns The currently active set of preferences.
   */
  async savePreferences(
    attributes: Partial<UserPreferences> = {}
  ): Promise<AllPreferences> {
    const keys = Object.keys(attributes) as (keyof UserPreferences)[];
    const originalPreferences = this.getPreferences();
    if (keys.length === 0) {
      return originalPreferences;
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
      log.error(
        mongoLogId(1_001_000_157),
        'preferences',
        'Failed to save preferences, error while saving models',
        {
          error: (err as Error).message,
        }
      );
    }

    const newPreferences = this.getPreferences();
    const changedPreferences = Object.fromEntries(
      Object.entries(newPreferences).filter(
        ([key, value]) =>
          value !== originalPreferences[key as keyof AllPreferences]
      )
    );
    if (Object.keys(changedPreferences).length > 0) {
      this._callOnPreferencesChanged(changedPreferences);
    }

    return newPreferences;
  }

  /**
   * Retrieve currently set preferences, accounting for all sources of preferences.
   *
   * @returns The currently active set of preferences.
   */
  getPreferences(): AllPreferences {
    return this._computePreferenceValuesAndStates().values;
  }

  private _getStoredValues(): AllPreferences {
    return {
      ...this._userPreferencesModel.getAttributes({
        props: true,
        derived: true,
      }),
      ...this._globalPreferences.cli,
      ...this._globalPreferences.global,
      ...this._globalPreferences.hardcoded,
    };
  }

  /**
   * Fetch the stored preference states and values, and apply functions
   * to derive the actual current states and values based on those,
   * if one has been provided for the option in question.
   */
  private _computePreferenceValuesAndStates() {
    const values = this._getStoredValues();
    const states: Partial<Record<string, PreferenceState>> = {};
    for (const key of Object.keys(this._globalPreferences.cli))
      states[key] = 'set-cli';
    for (const key of Object.keys(this._globalPreferences.global))
      states[key] = 'set-global';
    for (const key of Object.keys(this._globalPreferences.hardcoded))
      states[key] = 'hardcoded';

    const originalValues = { ...values };
    const originalStates = { ...states };

    function deriveValue<K extends keyof AllPreferences>(
      key: K
    ): {
      value: AllPreferences[K];
      state: PreferenceState;
    } {
      const descriptor = allPreferencesProps[key];
      if (!descriptor.deriveValue) {
        return { value: originalValues[key], state: originalStates[key] };
      }
      return (descriptor.deriveValue as DeriveValueFunction<AllPreferences[K]>)(
        // `as unknown` to work around TS bug(?) https://twitter.com/addaleax/status/1572191664252551169
        (k) =>
          (k as unknown) === key ? originalValues[k] : deriveValue(k).value,
        (k) =>
          (k as unknown) === key ? originalStates[k] : deriveValue(k).state
      );
    }

    for (const key of Object.keys(allPreferencesProps)) {
      // awkward IIFE to make typescript understand that `key` is the *same* key
      // in each loop iteration
      (<K extends keyof AllPreferences>(key: K) => {
        const result = deriveValue(key);
        values[key] = result.value;
        if (result.state !== undefined) states[key] = result.state;
      })(key as keyof AllPreferences);
    }

    return { values, states };
  }

  /**
   * If this is the first call to this method, this sets the defaults for
   * user preferences.
   */
  async ensureDefaultConfigurableUserPreferences(): Promise<void> {
    // Set the defaults and also update showedNetworkOptIn flag.
    const { showedNetworkOptIn } = await this.fetchPreferences();
    if (!showedNetworkOptIn) {
      await this.savePreferences({
        autoUpdates: true,
        enableMaps: true,
        trackErrors: true,
        readOnly: false,
        trackUsageStatistics: true,
        enableFeedbackPanel: true,
        showedNetworkOptIn: true,
        theme: THEMES.LIGHT,
      });
    }
  }

  /**
   * Return the subset of preferences that can be edited through the UI.
   *
   * @returns The currently active set of UI-modifiable preferences.
   */
  async getConfigurableUserPreferences(): Promise<UserConfigurablePreferences> {
    const preferences = await this.fetchPreferences();
    return Object.fromEntries(
      Object.entries(preferences).filter(
        ([key]) =>
          allPreferencesProps[key as keyof typeof preferences].ui === true
      )
    ) as UserConfigurablePreferences;
  }

  /**
   * Report which preferences were set through external sources, i.e.
   * command line or global configuration file.
   *
   * @returns A map of preference names to preference states if the preference has been set in the respective source.
   */
  getPreferenceStates(): PreferenceStateInformation {
    return this._computePreferenceValuesAndStates().states;
  }

  _callOnPreferencesChanged(
    changedPreferencesValues: Partial<AllPreferences>
  ): void {
    for (const callback of this._onPreferencesChangedCallbacks) {
      callback(changedPreferencesValues);
    }
  }

  /**
   * Install a listener that is called when preferences have been updated.
   *
   * @param callback A function taking the set of updated preferences.
   *
   * @return A function that can be called to unsubscribe at a later point in time.
   */
  onPreferencesChanged(callback: OnPreferencesChangedCallback): () => void {
    this._onPreferencesChangedCallbacks.push(callback);
    return () => {
      const index = this._onPreferencesChangedCallbacks.indexOf(callback);
      if (index !== -1) {
        this._onPreferencesChangedCallbacks.splice(index, 1);
      }
    };
  }
}
