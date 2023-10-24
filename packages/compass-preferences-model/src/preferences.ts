import type { ParsedGlobalPreferencesResult } from './global-config';
import {
  SandboxPreferences,
  StoragePreferences,
  type BasePreferencesStorage,
} from './storage';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { parseRecord } from './parse-record';
import type { FeatureFlagDefinition, FeatureFlags } from './feature-flags';
import { featureFlags } from './feature-flags';
import { z } from '@mongodb-js/compass-user-data';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-PREFERENCES');

export const THEMES_VALUES = ['DARK', 'LIGHT', 'OS_THEME'] as const;
export type THEMES = typeof THEMES_VALUES[number];

export type PermanentFeatureFlags = {
  showDevFeatureFlags?: boolean;
  enableDebugUseCsfleSchemaMap?: boolean;
};

type AllFeatureFlags = PermanentFeatureFlags & FeatureFlags;

export type UserConfigurablePreferences = PermanentFeatureFlags &
  FeatureFlags & {
    // User-facing preferences
    autoUpdates: boolean;
    enableGenAIFeatures: boolean;
    enableMaps: boolean;
    trackUsageStatistics: boolean;
    enableFeedbackPanel: boolean;
    networkTraffic: boolean;
    readOnly: boolean;
    enableShell: boolean;
    protectConnectionStrings?: boolean;
    forceConnectionOptions?: [key: string, value: string][];
    showKerberosPasswordField: boolean;
    showOIDCDeviceAuthFlow: boolean;
    browserCommandForOIDCAuth?: string;
    persistOIDCTokens?: boolean;
    enableDevTools: boolean;
    theme: THEMES;
    maxTimeMS?: number;
    installURLHandlers: boolean;
    protectConnectionStringsForNewConnections: boolean;
    // This preference is not a great fit for user preferences, but everything
    // except for user preferences doesn't allow required preferences to be
    // defined, so we are sticking it here
    atlasServiceBackendPreset:
      | 'compass-dev'
      | 'compass'
      | 'atlas-local'
      | 'atlas-dev'
      | 'atlas';
    // Features that are enabled by default in Compass, but are disabled in Data
    // Explorer
    enableExplainPlan: boolean;
    enableImportExport: boolean;
    enableAggregationBuilderRunPipeline: boolean;
    enableAggregationBuilderExtraOptions: boolean;
    enableSavedAggregationsQueries: boolean;
  };

export type InternalUserPreferences = {
  // These are internally used preferences that are not configurable
  // by users.
  showedNetworkOptIn: boolean; // Has the settings dialog been shown before.
  id: string;
  cloudFeatureRolloutAccess?: {
    GEN_AI_COMPASS?: boolean;
  };
  lastKnownVersion: string;
  currentUserId?: string;
  telemetryAnonymousId?: string;
};

// UserPreferences contains all preferences stored to disk.
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
  PermanentFeatureFlags;

type OnPreferencesChangedCallback = (
  changedPreferencesValues: Partial<AllPreferences>
) => void;

type PostProcessFunction<T> = (
  input: unknown,
  error: (message: string) => void
) => T;

type PreferenceType<T> = T extends string
  ? 'string'
  : T extends boolean
  ? 'boolean'
  : T extends number
  ? 'number'
  : T extends unknown[]
  ? 'array'
  : T extends Date
  ? 'date'
  : T extends object
  ? 'object'
  : never;

type PreferenceDefinition<K extends keyof AllPreferences> = {
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
    ? K extends keyof AllFeatureFlags
      ? boolean
      : false
    : boolean;
  validator: z.Schema<
    AllPreferences[K],
    z.ZodTypeDef,
    AllPreferences[K] | undefined
  >;
  type: PreferenceType<AllPreferences[K]>;
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

function featureFlagToPreferenceDefinition(
  featureFlag: FeatureFlagDefinition
): PreferenceDefinition<keyof FeatureFlags> {
  return {
    cli: true,
    global: true,
    ui: true,
    description: featureFlag.description,
    // if a feature flag is 'released' it will always return true
    // regardless of any persisted value.
    deriveValue:
      featureFlag.stage === 'released'
        ? () => ({ value: true, state: 'hardcoded' })
        : undefined,
    validator: z.boolean().default(false),
    type: 'boolean',
  };
}

const featureFlagsProps: Required<{
  [K in keyof FeatureFlags]: PreferenceDefinition<K>;
}> = Object.fromEntries(
  Object.entries(featureFlags).map(([key, value]) => [
    key as keyof FeatureFlags,
    featureFlagToPreferenceDefinition(value),
  ])
) as unknown as Required<{
  [K in keyof FeatureFlags]: PreferenceDefinition<K>;
}>;

const allFeatureFlagsProps: Required<{
  [K in keyof AllFeatureFlags]: PreferenceDefinition<K>;
}> = {
  /** Meta-feature-flag! Whether to show the dev flags of the feature flag settings modal */
  showDevFeatureFlags: {
    ui: true,
    cli: true,
    global: true,
    omitFromHelp: true,
    description: {
      short: 'Show Developer Feature Flags',
    },
    validator: z
      .boolean()
      .optional()
      .default(process.env.HADRON_CHANNEL === 'dev'),
    type: 'boolean',
  },

  /**
   * Permanent feature flag for debugging.
   * We want to encourage user to use Queryable Encryption, not CSFLE, so we do not
   * officially support the CSFLE schemaMap property.
   */
  enableDebugUseCsfleSchemaMap: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'CSFLE Schema Map Debugging',
    },
    validator: z.boolean().optional(),
    type: 'boolean',
  },

  ...featureFlagsProps,
};

export const storedUserPreferencesProps: Required<{
  [K in keyof UserPreferences]: PreferenceDefinition<K>;
}> = {
  /**
   * String identifier for this set of preferences. Default is `General`.
   */
  id: {
    ui: false,
    cli: false,
    global: false,
    description: null,
    validator: z.string().default('General'),
    type: 'string',
  },
  /**
   * Stores the last version compass was run as, e.g. `1.0.5`.
   */
  lastKnownVersion: {
    ui: false,
    cli: false,
    global: false,
    description: null,
    validator: z.string().default('0.0.0'),
    type: 'string',
  },
  /**
   * Stores whether or not the network opt-in screen has been shown to
   * the user already.
   */
  showedNetworkOptIn: {
    ui: false,
    cli: true,
    global: false,
    description: null,
    omitFromHelp: true,
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  /**
   * Stores the theme preference for the user.
   */
  theme: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Compass UI Theme',
    },
    validator: z
      .effect(z.enum(THEMES_VALUES), {
        type: 'preprocess',
        transform: (val) =>
          typeof val !== 'string' ? val : (val || 'light').toUpperCase(),
      })
      .optional()
      .default('LIGHT'),
    type: 'string',
  },
  /**
   * Stores a unique MongoDB ID for the current user.
   * Initially, we used this field as telemetry user identifier,
   * but this usage is being deprecated.
   * The telemetryAnonymousId should be used instead.
   */
  currentUserId: {
    ui: false,
    cli: false,
    global: false,
    description: null,
    validator: z.string().optional(),
    type: 'string',
  },
  /**
   * Stores a unique telemetry anonymous ID (uuid) for the current user.
   */
  telemetryAnonymousId: {
    ui: false,
    cli: false,
    global: false,
    description: null,
    validator: z.string().uuid().optional(),
    type: 'string',
  },
  /**
   * Enable/disable the AI services. This is currently set
   * in the atlas-service initialization where we make a request to the
   * ai endpoint to check what's enabled for the user (incremental rollout).
   */
  cloudFeatureRolloutAccess: {
    ui: false,
    cli: false,
    global: false,
    description: null,
    validator: z
      .object({
        GEN_AI_COMPASS: z.boolean().optional(),
      })
      .optional(),
    type: 'object',
  },
  /**
   * Master switch to disable all network traffic
   * and make Compass behave like Isolated edition always,
   * i.e. no network traffic other than the one to the db server
   * (which includes maps, telemetry, auto-updates).
   */
  networkTraffic: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable network traffic other than to the MongoDB database',
    },
    validator: z.boolean().default(true),
    type: 'boolean',
  },
  /**
   * Removes features that write to the database from the UI.
   */
  readOnly: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Set Read-Only Mode',
      long: 'Limit Compass strictly to read operations, with all write and delete capabilities removed.',
    },
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  /**
   * Switch to enable/disable the embedded shell.
   */
  enableShell: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable MongoDB Shell',
      long: 'Allow Compass to interact with MongoDB deployments via the embedded shell.',
    },
    deriveValue: deriveReadOnlyOptionState('enableShell'),
    validator: z.boolean().default(true),
    type: 'boolean',
  },
  /**
   * Switch to enable/disable maps rendering.
   */
  enableMaps: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable Geographic Visualizations',
      long: 'Allow Compass to make requests to a 3rd party mapping service.',
    },
    deriveValue: deriveNetworkTrafficOptionState('enableMaps'),
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  enableGenAIFeatures: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable AI Features',
      long: 'Allow the use of AI features in Compass which make requests to 3rd party services. These features are currently experimental and offered as a preview to only a limited number of users.',
    },
    deriveValue: deriveNetworkTrafficOptionState('enableGenAIFeatures'),
    validator: z.boolean().default(true),
    type: 'boolean',
  },
  /**
   * Switch to enable/disable Intercom panel (renamed from `intercom`).
   */
  enableFeedbackPanel: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Give Product Feedback',
      long: 'Enables a tool that our Product team can use to occasionally reach out for feedback about Compass.',
    },
    deriveValue: deriveNetworkTrafficOptionState('enableFeedbackPanel'),
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  /**
   * Switch to enable/disable usage statistics collection
   * (renamed from `googleAnalytics`).
   */
  trackUsageStatistics: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable Usage Statistics',
      long: 'Allow Compass to send anonymous usage statistics.',
    },
    deriveValue: deriveNetworkTrafficOptionState('trackUsageStatistics'),
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  /**
   * Switch to enable/disable automatic updates.
   */
  autoUpdates: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable Automatic Updates',
      long: 'Allow Compass to periodically check for new updates.',
    },
    deriveValue: deriveNetworkTrafficOptionState('autoUpdates'),
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  /**
   * Switch to hide credentials in connection strings from users.
   */
  protectConnectionStrings: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Protect Connection String Secrets',
      long: 'Hide credentials in connection strings from users.',
    },
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  /**
   * Switch to enable DevTools in Electron.
   */
  enableDevTools: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable DevTools',
      long: `Enable the Chromium Developer Tools that can be used to debug Electron's process.`,
    },
    deriveValue: deriveFeatureRestrictingOptionsState('enableDevTools'),
    validator: z.boolean().default(process.env.APP_ENV === 'webdriverio'),
    type: 'boolean',
  },
  /**
   * Switch to show the Kerberos password field in the connection form.
   */
  showKerberosPasswordField: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Show Kerberos Password Field',
      long: 'Show a password field for Kerberos authentication. Typically only useful when attempting to authenticate as another user than the current system user.',
    },
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  /**
   * Switch to show the OIDC device auth flow option in the connection form.
   */
  showOIDCDeviceAuthFlow: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Show Device Auth Flow Checkbox',
      long: 'Show a checkbox on the connection form to enable device auth flow authentication for MongoDB server OIDC Authentication. This enables a less secure authentication flow that can be used as a fallback when browser-based authentication is unavailable.',
    },
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  /**
   * Input to change the browser command used for OIDC authentication.
   */
  browserCommandForOIDCAuth: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Browser command to use for authentication',
      long: 'Specify a shell command that is run to start the browser for authenticating with the OIDC identity provider for the server connection or when logging in to your Atlas Cloud account. Leave this empty for default browser.',
    },
    validator: z.string().optional(),
    type: 'string',
  },
  /**
   * Input to change the browser command used for OIDC authentication.
   */
  persistOIDCTokens: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Stay logged in with OIDC',
      long: 'Remain logged in when using the MONGODB-OIDC authentication mechanism for MongoDB server connection. Access tokens are encrypted using the system keychain before being stored.',
    },
    validator: z.boolean().default(true),
    type: 'boolean',
  },
  /**
   * Override certain connection string properties.
   */
  forceConnectionOptions: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Override Connection String Properties',
      long: 'Force connection string properties to take specific values',
    },
    customPostProcess: parseRecord,
    validator: z.array(z.tuple([z.string(), z.string()])).optional(),
    type: 'array',
  },
  /**
   * Set an upper limit for maxTimeMS for operations started by Compass.
   */
  maxTimeMS: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Upper Limit for maxTimeMS for Compass Database Operations',
    },
    validator: z.number().optional(),
    type: 'number',
  },
  /**
   * Do not handle mongodb:// and mongodb+srv:// URLs via Compass
   */
  installURLHandlers: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Install Compass as URL Protocol Handler',
      long: 'Register Compass as a handler for mongodb:// and mongodb+srv:// URLs',
    },
    validator: z.boolean().default(true),
    type: 'boolean',
  },
  /**
   * Determines if the toggle to edit connection string for new connections
   * should be in the off state or in the on state by default
   */
  protectConnectionStringsForNewConnections: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short:
        'If true, "Edit connection string" is disabled for new connections by default',
    },
    validator: z.boolean().default(false),
    type: 'boolean',
  },

  /**
   * Chooses atlas service backend configuration from preset
   *  - compass-dev: locally running compass kanopy backend (localhost)
   *  - compass:    compass kanopy backend (compass.mongodb.com)
   *  - atlas-local: local mms backend (http://localhost:8080)
   *  - atlas-dev:   dev mms backend (cloud-dev.mongodb.com)
   *  - atlas:       mms backend (cloud.mongodb.com)
   */
  atlasServiceBackendPreset: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Configuration used by atlas service',
    },
    validator: z
      .enum(['compass-dev', 'compass', 'atlas-dev', 'atlas-local', 'atlas'])
      .default('atlas'),
    type: 'string',
  },

  enableImportExport: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable import / export feature',
    },
    validator: z.boolean().default(true),
    type: 'boolean',
  },

  enableAggregationBuilderRunPipeline: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable "Run Pipeline" feature in aggregation builder',
    },
    validator: z.boolean().default(true),
    type: 'boolean',
  },

  enableExplainPlan: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable explain plan feature in CRUD and aggregation view',
    },
    validator: z.boolean().default(true),
    type: 'boolean',
  },

  enableAggregationBuilderExtraOptions: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short:
        'Enable preview input limit and collation options in aggregation view',
    },
    validator: z.boolean().default(true),
    type: 'boolean',
  },

  enableSavedAggregationsQueries: {
    ui: true,
    cli: true,
    global: true,
    description: {
      short: 'Enable saving and opening saved aggregations and queries',
    },
    validator: z.boolean().default(true),
    type: 'boolean',
  },

  ...allFeatureFlagsProps,
};

const cliOnlyPreferencesProps: Required<{
  [K in keyof CliOnlyPreferences]: PreferenceDefinition<K>;
}> = {
  exportConnections: {
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Export Favorite Connections',
      long: 'Export Compass favorite connections. Can be used with --passphrase.',
    },
    validator: z.string().optional(),
    type: 'string',
  },
  importConnections: {
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Import Favorite Connections',
      long: 'Import Compass favorite connections. Can be used with --passphrase.',
    },
    validator: z.string().optional(),
    type: 'string',
  },
  passphrase: {
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Connection Export/Import Passphrase',
      long: 'Specify a passphrase for encrypting/decrypting secrets.',
    },
    validator: z.string().optional(),
    type: 'string',
  },
  help: {
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Show Compass Options',
    },
    validator: z.boolean().optional(),
    type: 'boolean',
  },
  version: {
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Show Compass Version',
    },
    validator: z.boolean().optional(),
    type: 'boolean',
  },
  showExampleConfig: {
    ui: false,
    cli: true,
    global: false,
    description: {
      short: 'Show Example Config File',
    },
    validator: z.boolean().optional(),
    type: 'boolean',
  },
};

const nonUserPreferences: Required<{
  [K in keyof NonUserPreferences]: PreferenceDefinition<K>;
}> = {
  ignoreAdditionalCommandLineFlags: {
    ui: false,
    cli: true,
    global: true,
    description: {
      short: 'Allow Additional CLI Flags',
      long: 'Allow specifying command-line flags that Compass does not understand, e.g. Electron or Chromium flags',
    },
    validator: z.boolean().default(false),
    type: 'boolean',
  },
  positionalArguments: {
    ui: false,
    cli: true,
    global: false,
    description: {
      short:
        'Specify a Connection String or Connection ID to Automatically Connect',
    },
    omitFromHelp: true,
    validator: z.array(z.string()).optional(),
    type: 'array',
  },
  file: {
    ui: false,
    cli: true,
    global: true,
    description: {
      short: 'Specify a List of Connections for Automatically Connecting',
    },
    validator: z.string().optional(),
    type: 'string',
  },
  username: {
    ui: false,
    cli: true,
    global: true,
    description: {
      short: 'Specify a Username for Automatically Connecting',
    },
    validator: z.string().optional(),
    type: 'string',
  },
  password: {
    ui: false,
    cli: true,
    global: true,
    description: {
      short: 'Specify a Password for Automatically Connecting',
    },
    validator: z.string().optional(),
    type: 'string',
  },
};

export const allPreferencesProps: Required<{
  [K in keyof AllPreferences]: PreferenceDefinition<K>;
}> = {
  ...storedUserPreferencesProps,
  ...cliOnlyPreferencesProps,
  ...nonUserPreferences,
};

export function getSettingDescription<
  Name extends Exclude<keyof AllPreferences, keyof InternalUserPreferences>
>(
  name: Name
): Pick<PreferenceDefinition<Name>, 'description'> & { type: unknown } {
  const { description, type } = allPreferencesProps[
    name
  ] as PreferenceDefinition<Name>;
  return {
    description,
    type,
  };
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
  private _preferencesStorage: BasePreferencesStorage;
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
    this._preferencesStorage = isSandbox
      ? new SandboxPreferences()
      : new StoragePreferences(basepath);

    this._onPreferencesChangedCallbacks = [];
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

  setupStorage() {
    return this._preferencesStorage.setup();
  }

  // Returns a value that can be passed to Preferences.CreateSandbox()
  async getPreferenceSandboxProperties(): Promise<PreferenceSandboxProperties> {
    const value: PreferenceSandboxPropertiesImpl = {
      user: this._getUserPreferenceValues(),
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

    try {
      await this._preferencesStorage.updatePreferences(attributes);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_157),
        'preferences',
        'Failed to save preferences, error while saving models',
        {
          error: (err as Error).message,
        }
      );
      if (err instanceof z.ZodError) {
        throw err;
      }
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

  private _getUserPreferenceValues() {
    return this._preferencesStorage.getPreferences();
  }

  private _getStoredValues(): AllPreferences {
    return {
      ...this._getUserPreferenceValues(),
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
    const { showedNetworkOptIn } = this.getPreferences();
    if (!showedNetworkOptIn) {
      await this.savePreferences({
        autoUpdates: true,
        enableGenAIFeatures: true,
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
  getConfigurableUserPreferences(): UserConfigurablePreferences {
    const preferences = this.getPreferences();
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
