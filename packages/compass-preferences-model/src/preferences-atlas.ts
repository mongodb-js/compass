import type { UserDataType } from '@mongodb-js/compass-user-data';
import type { PreferencesStorage } from './preferences-storage';
import {
  getDefaultsForStoredPreferences,
  getPreferencesValidator,
} from './preferences-schema';
import type { StoredPreferences } from './preferences-schema';

const APP_PREFERENCES_ENDPOINT: UserDataType = 'AppPreferences';
const appPreferencesValidator = getPreferencesValidator().partial();
const defaultPreferences = getDefaultsForStoredPreferences();

export type AtlasPreferencesRemoteService = {
  authenticatedFetch(url: string, init?: RequestInit): Promise<Response>;
  userDataEndpoint(dataType: UserDataType): string;
};

export type AtlasPreferencesDefaults = {
  compassWebDefaults?: Partial<StoredPreferences>;
  cloudOverrides?: Partial<StoredPreferences>;
};

async function doLoadAtlasPreferences(
  remote: AtlasPreferencesRemoteService
): Promise<Partial<StoredPreferences> | 'backend-error'> {
  let result: Response;
  try {
    result = await remote.authenticatedFetch(
      remote.userDataEndpoint(APP_PREFERENCES_ENDPOINT),
      {
        method: 'GET',
      }
    );
  } catch {
    return 'backend-error';
  }

  // Nothing was ever saved for this user.
  if (result.status === 404) {
    return {};
  }
  if (!result.ok) {
    return 'backend-error';
  }

  const envelope = (await result.json()) as { data?: string };
  if (!envelope.data) {
    return {};
  }

  let userData: Partial<unknown> | undefined;
  try {
    userData = JSON.parse(envelope.data);
    appPreferencesValidator.parse(userData);
  } catch {
    return {};
  }

  return userData as Partial<StoredPreferences>;
}

async function doSaveAtlasPreferences(
  remote: AtlasPreferencesRemoteService,
  preferences: Partial<StoredPreferences>
): Promise<void | 'invalid-preferences' | 'backend-error'> {
  try {
    appPreferencesValidator.parse(preferences);
  } catch {
    return 'invalid-preferences';
  }

  let result: Response;
  try {
    result = await remote.authenticatedFetch(
      remote.userDataEndpoint(APP_PREFERENCES_ENDPOINT),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: JSON.stringify(preferences),
          createdAt: new Date(),
        }),
      }
    );
  } catch {
    return 'backend-error';
  }

  if (!result.ok) {
    return 'backend-error';
  }
}

export class AtlasPreferencesStorage implements PreferencesStorage {
  private readonly atlasRemoteService: AtlasPreferencesRemoteService;
  private readonly defaults: AtlasPreferencesDefaults;
  private cachedPreferences: Partial<StoredPreferences> | null;

  constructor(
    atlasRemoteService: AtlasPreferencesRemoteService,
    defaults: AtlasPreferencesDefaults
  ) {
    this.atlasRemoteService = atlasRemoteService;
    this.defaults = defaults;
    this.cachedPreferences = null;
  }

  async setup(): Promise<void> {
    if (this.cachedPreferences !== null) {
      return;
    }

    const storedPrefs = await doLoadAtlasPreferences(this.atlasRemoteService);
    if (storedPrefs === 'backend-error') {
      this.cachedPreferences = {};
    } else {
      this.cachedPreferences = storedPrefs;
    }
  }

  getPreferences(): StoredPreferences {
    return {
      ...defaultPreferences,
      ...this.defaults.compassWebDefaults,
      ...this.cachedPreferences,
      ...this.defaults.cloudOverrides,
    };
  }

  async updatePreferences(
    attributes: Partial<StoredPreferences>
  ): Promise<void> {
    const prefsToSave = { ...this.cachedPreferences, ...attributes };
    const result = await doSaveAtlasPreferences(
      this.atlasRemoteService,
      prefsToSave
    );

    // Throwing leaves the cached copy untouched, so a failed save doesn't show
    // up as applied. Preferences.savePreferences() logs the error.
    if (result === 'invalid-preferences' || result === 'backend-error') {
      throw new Error(`Failed to save preferences: ${result}`);
    }

    this.cachedPreferences = prefsToSave;
  }
}
