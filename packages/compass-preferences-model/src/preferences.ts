import { z } from 'zod';
import { type Logger } from '@mongodb-js/compass-logging';

import type { ParsedGlobalPreferencesResult } from './global-config';
import type {
  AllPreferences,
  PreferenceState,
  PreferenceStateInformation,
  UserConfigurablePreferences,
  UserPreferences,
  DeriveValueFunction,
} from './preferences-schema';
import { allPreferencesProps } from './preferences-schema';
import { InMemoryStorage } from './preferences-in-memory-storage';
import type { PreferencesStorage } from './preferences-storage';
import type { getActiveUser } from '.';

export interface PreferencesAccess {
  savePreferences(
    attributes: Partial<UserPreferences>
  ): Promise<AllPreferences>;
  refreshPreferences(): Promise<AllPreferences>;
  getPreferences(): AllPreferences;
  ensureDefaultConfigurableUserPreferences(): Promise<void>;
  getConfigurableUserPreferences(): Promise<UserConfigurablePreferences>;
  getPreferenceStates(): Promise<PreferenceStateInformation>;
  onPreferenceValueChanged<K extends keyof AllPreferences>(
    preferenceName: K,
    callback: (value: AllPreferences[K]) => void
  ): () => void;
  createSandbox(): Promise<PreferencesAccess>;
  getPreferencesUser(): ReturnType<typeof getActiveUser>;
}

type OnPreferencesChangedCallback = (
  changedPreferencesValues: Partial<AllPreferences>
) => void;

export type PreferenceSandboxProperties = string;
// Internal to the Preferences class, so PreferenceSandboxProperties is an opaque string
type PreferenceSandboxPropertiesImpl = {
  user: UserPreferences;
  global: Partial<ParsedGlobalPreferencesResult>;
};

export class Preferences {
  private _logger: Logger;
  private _onPreferencesChangedCallbacks: OnPreferencesChangedCallback[];
  private _preferencesStorage: PreferencesStorage;
  private _globalPreferences: {
    cli: Partial<AllPreferences>;
    global: Partial<AllPreferences>;
    hardcoded: Partial<AllPreferences>;
  };

  constructor({
    logger,
    globalPreferences,
    preferencesStorage = new InMemoryStorage(),
  }: {
    logger: Logger;
    preferencesStorage: PreferencesStorage;
    globalPreferences?: Partial<ParsedGlobalPreferencesResult>;
  }) {
    this._logger = logger;
    this._preferencesStorage = preferencesStorage;

    this._onPreferencesChangedCallbacks = [];
    this._globalPreferences = {
      cli: {},
      global: {},
      hardcoded: {},
      ...globalPreferences,
    };

    if (Object.keys(this._globalPreferences.hardcoded).length > 0) {
      this._logger.log.info(
        this._logger.mongoLogId(1_001_000_159),
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
    props: PreferenceSandboxProperties | undefined,
    logger: Logger
  ): Promise<Preferences> {
    const { user, global } = props
      ? (JSON.parse(props) as PreferenceSandboxPropertiesImpl)
      : { user: {}, global: {} };
    const instance = new Preferences({
      logger,
      globalPreferences: global,
      preferencesStorage: new InMemoryStorage(),
    });
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
      this._logger.log.error(
        this._logger.mongoLogId(1_001_000_157),
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
