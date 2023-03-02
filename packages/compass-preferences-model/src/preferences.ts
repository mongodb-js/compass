import storageMixin from 'storage-mixin';
import { promisifyAmpersandMethod } from '@mongodb-js/compass-utils';
import type { AmpersandMethodOptions } from '@mongodb-js/compass-utils';
import type { ParsedGlobalPreferencesResult } from './global-config';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { parseRecord } from './parse-record';
const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-PREFERENCES');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Model = require('ampersand-model');

export const THEMES_VALUES = ['DARK', 'LIGHT', 'OS_THEME'] as const;
export type THEMES = typeof THEMES_VALUES[number];

export type FeatureFlags = {
  showDevFeatureFlags?: boolean;
  lgDarkmode?: boolean;
  debugUseCsfleSchemaMap?: boolean;
  showFocusMode?: boolean;
  useNewExportBackend?: boolean;
};

export type UserConfigurablePreferences = FeatureFlags & {
  // User-facing preferences
  autoUpdates: boolean;
  enableMaps: boolean;
  trackUsageStatistics: boolean;
  enableFeedbackPanel: boolean;
  networkTraffic: boolean;
  readOnly: boolean;
  enableShell: boolean;
  protectConnectionStrings?: boolean;
  forceConnectionOptions?: [key: string, value: string][];
  showKerberosPasswordField: boolean;
  enableDevTools: boolean;
  theme: THEMES;
  maxTimeMS?: number;
  installURLHandlers: boolean;
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
  showExampleConfig?: boolean;
};

export type NonUserPreferences = {
  ignoreAdditionalCommandLineFlags?: boolean;
  positionalArguments?: string[];
  file?: string;
  username?: string;
  password?: string;
};

export type AllPreferences = UserPreferences &
  CliOnlyPreferences &
  NonUserPreferences &
  FeatureFlags;

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

type PostProcessFunction<T> = (
  input: unknown,
  error: (message: string) => void
) => T;

type PreferenceDefinition<K extends keyof AllPreferences> = {
  /** The type of the preference value, in Ampersand naming */
  type: AmpersandType<AllPreferences[K]>;
  /** An optional default value for the preference */
  default?: AllPreferences[K];
  /** Whether the preference is required in the Ampersand model */
  required: boolean;
  /** An exhaustive list of possible values for this preference (also an Ampersand feature) */
  values?: readonly AllPreferences[K][];
  /** Whether the preference can be modified through the Settings UI */
  ui: K extends keyof UserConfigurablePreferences ? true : false;
  /** Whether the preference can be set on the command line */
  cli: K extends keyof Omit<InternalUserPreferences, 'showedNetworkOptIn'>
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
  /** A method for cleaning up/normalizing input from the command line or global config file */
  customPostProcess?: PostProcessFunction<AllPreferences[K]>;
  /** Specify that this option should not be listed in --help output */
  omitFromHelp?: K extends keyof (UserConfigurablePreferences &
    CliOnlyPreferences)
    ? K extends keyof FeatureFlags
      ? boolean
      : false
    : boolean;
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
      (v('networkTraffic') ? undefined : s('networkTraffic') ?? 'derived'),
  });
}

/** Helper for defining how to derive value/state for feature-restricting preferences */
function deriveFeatureRestrictingOptionsState<K extends keyof AllPreferences>(
  property: K
): DeriveValueFunction<boolean> {
  return (v, s) => ({
    value:
      v(property) &&
      v('enableShell') &&
      !v('maxTimeMS') &&
      !v('protectConnectionStrings') &&
      !v('readOnly'),
    state:
      s(property) ??
      (v('protectConnectionStrings')
        ? s('protectConnectionStrings') ?? 'derived'
        : undefined) ??
      (v('readOnly') ? s('readOnly') ?? 'derived' : undefined) ??
      (v('enableShell') ? undefined : s('enableShell') ?? 'derived') ??
      (v('maxTimeMS') ? s('maxTimeMS') ?? 'derived' : undefined),
  });
}

/** Helper for defining how to derive value/state for readOnly-affected preferences */
function deriveReadOnlyOptionState<K extends keyof AllPreferences>(
  property: K
): DeriveValueFunction<boolean> {
  return (v, s) => ({
    value: v(property) && !v('readOnly'),
    state:
      s(property) ?? (v('readOnly') ? s('readOnly') ?? 'derived' : undefined),
  });
}

const featureFlagsProps: Required<{
  [K in keyof FeatureFlags]: PreferenceDefinition<K>;
}> = {
  /** Meta-feature-flag! Whether to show the dev flags of the feature flag settings modal */
  showDevFeatureFlags: {
    type: 'boolean',
    required: false,
    default: undefined,
    ui: true,
    cli: true,
    global: true,
    omitFromHelp: true,
    description: {
      short: 'Show Developer Feature Flags',
    },
  },

  /**
   * Currently Compass uses `darkreader` to globally change the views of
   * Compass to a dark theme. Turning on this feature flag stops darkreader
   * from being used and instead components which have darkMode
   * support will listen to the theme to change their styles.
   */
  lgDarkmode: {
    type: 'boolean',
    required: false,
    default: false,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Modern Dark Mode',
    },
  },

  /**
   * Permanent feature flag for debugging.
   * We want to encourage user to use Queryable Encryption, not CSFLE, so we do not
   * officially support the CSFLE schemaMap property.
   */
  debugUseCsfleSchemaMap: {
    type: 'boolean',
    required: false,
    default: false,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'CSFLE Schema Map Debugging',
    },
  },

  /**
   * Feature flag for the focus mode in aggregation pipeline builder.
   */
  showFocusMode: {
    type: 'boolean',
    required: false,
    default: true,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Focus Mode in Stage Editor',
      long: 'Use focus mode to compose aggregation pipeline stage.',
    },
  },

  /**
   * Feature flag for enabling the use of the new backend api for
   * exporting documents. Epic: COMPASS-5576
   */
  useNewExportBackend: {
    type: 'boolean',
    required: false,
    default: false,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'New Export Backend',
      long: 'Use the new backend api for exporting documents.',
    },
  },
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
    omitFromHelp: true,
  },
  /**
   * Stores the theme preference for the user.
   */
  theme: {
    type: 'string',
    required: true,
    default: 'LIGHT',
    values: THEMES_VALUES,
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
      short: 'Set Read-Only Mode',
      long: 'Limit Compass strictly to read operations, with all write and delete capabilities removed.',
    },
  },
  /**
   * Switch to enable/disable the embedded shell.
   */
  enableShell: {
    type: 'boolean',
    required: true,
    default: true,
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
  /**
   * Switch to hide credentials in connection strings from users.
   */
  protectConnectionStrings: {
    type: 'boolean',
    required: false,
    default: false,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Protect Connection String Secrets',
      long: 'Hide credentials in connection strings from users.',
    },
  },
  /**
   * Switch to enable DevTools in Electron.
   */
  enableDevTools: {
    type: 'boolean',
    required: false,
    default: false,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable DevTools',
      long: `Enable the Chromium Developer Tools that can be used to debug Electron's process.`,
    },
    deriveValue: deriveFeatureRestrictingOptionsState('enableDevTools'),
  },
  /**
   * Switch to show the Kerberos password field in the connection form.
   */
  showKerberosPasswordField: {
    type: 'boolean',
    required: false,
    default: false,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Show Kerberos Password Field',
      long: 'Show a password field for Kerberos authentication. Typically only useful when attempting to authenticate as another user than the current system user.',
    },
  },
  /**
   * Override certain connection string properties.
   */
  forceConnectionOptions: {
    type: 'array',
    required: false,
    default: undefined,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Override Connection String Properties',
      long: 'Force connection string properties to take specific values',
    },
    customPostProcess: parseRecord,
  },
  /**
   * Set an upper limit for maxTimeMS for operations started by Compass.
   */
  maxTimeMS: {
    type: 'number',
    required: false,
    default: undefined,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Upper Limit for maxTimeMS for Compass Database Operations',
    },
  },
  /**
   * Do not handle mongodb:// and mongodb+srv:// URLs via Compass
   */
  installURLHandlers: {
    type: 'boolean',
    required: true,
    default: true,
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Install Compass as URL Protocol Handler',
      long: 'Register Compass as a handler for mongodb:// and mongodb+srv:// URLs',
    },
  },
  ...featureFlagsProps,
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
  showExampleConfig: {
    type: 'boolean',
    required: false,
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Show Example Config File',
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
    omitFromHelp: true,
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
  username: {
    type: 'string',
    required: false,
    ui: false,
    cli: true,
    global: true,
    description: {
      short: 'Specify a Username for Automatically Connecting',
    },
  },
  password: {
    type: 'string',
    required: false,
    ui: false,
    cli: true,
    global: true,
    description: {
      short: 'Specify a Password for Automatically Connecting',
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

export function getSettingDescription<
  Name extends Exclude<keyof AllPreferences, keyof InternalUserPreferences>
>(
  name: Name
): Pick<PreferenceDefinition<Name>, 'description' | 'type' | 'required'> {
  const { description, type, required } = allPreferencesProps[
    name
  ] as PreferenceDefinition<Name>;
  return { description, type, required };
}

/* Identifies a source from which the preference was set */
export type PreferenceState =
  | 'set-cli' // Can be set directly or derived from a preference set via cli args.
  | 'set-global' // Can be set directly or derived from a preference set via global config.
  | 'hardcoded'
  | 'derived' // Derived from a preference set by a user via setting UI.
  | undefined;

export type PreferenceStateInformation = Partial<
  Record<keyof AllPreferences, PreferenceState>
>;

export type PreferenceSandboxProperties = string;
// Internal to the Preferences class, so PreferenceSandboxProperties is an opaque string
type PreferenceSandboxPropertiesImpl = {
  user: UserPreferences;
  global: Partial<ParsedGlobalPreferencesResult>;
};

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
    globalPreferences?: Partial<ParsedGlobalPreferencesResult>,
    isSandbox?: boolean
  ) {
    const ampersandModelDefinition = {
      props: modelPreferencesProps,
      extraProperties: 'ignore',
      idAttribute: 'id',
    };
    // User preferences are stored to disk via the Ampersand model,
    // or not stored externally at all if that was requested.
    const PreferencesModel = Model.extend(storageMixin, {
      ...ampersandModelDefinition,
      namespace: 'AppPreferences',
      storage: isSandbox
        ? {
            backend: 'null',
          }
        : {
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

  // Returns a value that can be passed to Preferences.CreateSandbox()
  getPreferenceSandboxProperties(): Promise<PreferenceSandboxProperties> {
    const value: PreferenceSandboxPropertiesImpl = {
      user: this._getUserPreferenceModelValues(),
      global: this._globalPreferences,
    };
    return Promise.resolve(JSON.stringify(value));
  }

  // Create a
  static async CreateSandbox(
    props: PreferenceSandboxProperties | undefined
  ): Promise<Preferences> {
    const { user, global } = props
      ? (JSON.parse(props) as PreferenceSandboxPropertiesImpl)
      : { user: {}, global: {} };
    const instance = new Preferences(undefined, global, true);
    await instance.savePreferences(user);
    return instance;
  }

  /**
   * Load preferences from the user preference storage.
   * The return value also accounts for preferences set from other sources.
   *
   * @returns The currently active set of preferences.
   */
  async fetchPreferences(): Promise<AllPreferences> {
    const originalPreferences = this.getPreferences();
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

    const newPreferences = this.getPreferences();
    this._afterPreferencesUpdate(originalPreferences, newPreferences);

    return newPreferences;
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
    const originalPreferences = await this.fetchPreferences();
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
    this._afterPreferencesUpdate(originalPreferences, newPreferences);

    return newPreferences;
  }

  _afterPreferencesUpdate(
    originalPreferences: AllPreferences,
    newPreferences: AllPreferences
  ): void {
    const changedPreferences = Object.fromEntries(
      Object.entries(newPreferences).filter(
        ([key, value]) =>
          value !== originalPreferences[key as keyof AllPreferences]
      )
    );
    if (Object.keys(changedPreferences).length > 0) {
      this._callOnPreferencesChanged(changedPreferences);
    }
  }

  /**
   * Retrieve currently set preferences, accounting for all sources of preferences.
   *
   * @returns The currently active set of preferences.
   */
  getPreferences(): AllPreferences {
    return this._computePreferenceValuesAndStates().values;
  }

  private _getUserPreferenceModelValues(): UserPreferences {
    return this._userPreferencesModel.getAttributes({
      props: true,
      derived: true,
    });
  }

  private _getStoredValues(): AllPreferences {
    return {
      ...this._getUserPreferenceModelValues(),
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
        trackUsageStatistics: true,
        enableFeedbackPanel: true,
        showedNetworkOptIn: true,
        theme: 'LIGHT',
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
