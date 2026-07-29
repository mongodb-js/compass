import type { UserDataType } from '@mongodb-js/compass-user-data';
import type { PreferencesStorage } from './preferences-storage';
import {
  getDefaultsForStoredPreferences,
  getPreferencesValidator,
} from './preferences-schema';
import type { StoredPreferences } from './preferences-schema';

const APP_PREFERENCES: UserDataType = 'AppPreferences';
const appPreferencesValidator = getPreferencesValidator().partial();
const defaultPreferences = getDefaultsForStoredPreferences();

// This type exists to avoid a circular dependency between preferences-model and atlas-service.
export type AtlasServiceLike = {
  authenticatedFetch(url: string, init?: RequestInit): Promise<Response>;
  userDataEndpoint(dataType: UserDataType): string;
};

export type AtlasPreferencesLoadResult =
  | { status: 'loaded'; preferences: Partial<StoredPreferences> }
  | { status: 'empty' }
  | { status: 'failed' };

export async function loadAtlasPreferences(
  atlasService: AtlasServiceLike
): Promise<AtlasPreferencesLoadResult> {
  let res: Response;
  try {
    res = await atlasService.authenticatedFetch(
      atlasService.userDataEndpoint(APP_PREFERENCES),
      { method: 'GET' }
    );
  } catch {
    return { status: 'failed' };
  }

  if (res.status === 404) {
    return { status: 'empty' };
  }

  if (!res.ok) {
    return { status: 'failed' };
  }

  try {
    const { data } = (await res.json()) as { data: string };
    const preferences = appPreferencesValidator.parse(JSON.parse(data));
    return { status: 'loaded', preferences };
  } catch {
    // Malformed stored data is treated as if nothing was ever saved so we can overwrite it
    return { status: 'empty' };
  }
}

async function saveAtlasPreferences(
  atlasService: AtlasServiceLike,
  preferences: Partial<StoredPreferences>
): Promise<boolean> {
  try {
    appPreferencesValidator.parse(preferences);
    const res = await atlasService.authenticatedFetch(
      atlasService.userDataEndpoint(APP_PREFERENCES),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: JSON.stringify(preferences),
          createdAt: new Date(),
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export type AtlasPreferencesStorageOptions = {
  loadResult: AtlasPreferencesLoadResult;
  compassWebDefaults?: Partial<StoredPreferences>;
  cloudOverrides?: Partial<StoredPreferences>;
};

export class AtlasPreferencesStorage implements PreferencesStorage {
  private readonly atlasService: AtlasServiceLike;
  private readonly compassWebDefaults: Partial<StoredPreferences>;
  private readonly cloudOverrides: Partial<StoredPreferences>;
  private savedPreferences: Partial<StoredPreferences>;
  private sessionChanges: Partial<StoredPreferences> = {};

  constructor(
    atlasService: AtlasServiceLike,
    {
      loadResult,
      compassWebDefaults = {},
      cloudOverrides = {},
    }: AtlasPreferencesStorageOptions
  ) {
    this.atlasService = atlasService;
    this.compassWebDefaults = compassWebDefaults;
    this.cloudOverrides = cloudOverrides;
    this.savedPreferences =
      loadResult.status === 'loaded' ? loadResult.preferences : {};
  }

  setup(): Promise<void> {
    return Promise.resolve();
  }

  getPreferences(): StoredPreferences {
    return {
      ...defaultPreferences,
      ...this.compassWebDefaults,
      ...this.savedPreferences,
      ...this.sessionChanges,
      ...this.cloudOverrides,
    };
  }

  async updatePreferences(
    attributes: Partial<StoredPreferences>
  ): Promise<boolean> {
    this.sessionChanges = { ...this.sessionChanges, ...attributes };

    const loadResult = await loadAtlasPreferences(this.atlasService);
    if (loadResult.status === 'failed') {
      return false;
    }

    const updatedPreferences = {
      ...(loadResult.status === 'loaded' ? loadResult.preferences : {}),
      ...this.sessionChanges,
    };

    const didSavePreferences = await saveAtlasPreferences(
      this.atlasService,
      updatedPreferences
    );
    if (didSavePreferences) {
      this.savedPreferences = updatedPreferences;
    }
    return didSavePreferences;
  }
}
