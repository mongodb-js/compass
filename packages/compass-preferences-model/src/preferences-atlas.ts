import { type z, AtlasUserData } from '@mongodb-js/compass-user-data';
import type { AtlasServiceLike } from '@mongodb-js/compass-user-data';
import {
  getDefaultsForStoredPreferences,
  getPreferencesValidator,
} from './preferences-schema';
import type {
  AllPreferences,
  StoredPreferences,
  StoredPreferencesValidator,
} from './preferences-schema';

import type { PreferencesStorage } from './preferences-storage';

export type AtlasPreferencesStorageOptions = {
  defaults?: Partial<AllPreferences>;
  overrides?: Partial<AllPreferences>;
};

export class AtlasPreferencesStorage implements PreferencesStorage {
  private readonly defaultPreferences = getDefaultsForStoredPreferences();
  private readonly userData: AtlasUserData<
    StoredPreferencesValidator,
    'AppPreferences'
  >;
  private preferences: StoredPreferences = getDefaultsForStoredPreferences();
  private defaults: Partial<AllPreferences>;
  private overrides: Partial<AllPreferences>;

  constructor(
    atlasService: AtlasServiceLike,
    { defaults = {}, overrides = {} }: AtlasPreferencesStorageOptions = {}
  ) {
    this.userData = new AtlasUserData(
      getPreferencesValidator(),
      'AppPreferences',
      {
        atlasService,
      }
    );
    this.defaults = defaults;
    this.overrides = overrides;
  }

  // Cloud-derived values are only known once the preferences request resolves,
  // so they are provided after setup has already started reading in parallel.
  setOverrides(overrides: Partial<AllPreferences> = {}) {
    this.overrides = overrides;
  }

  async setup() {
    this.preferences = await this.readPreferences();
  }

  private async writePreferences(
    preferences: z.input<StoredPreferencesValidator>
  ): Promise<void> {
    await this.userData.write(undefined, preferences);
  }

  private async readPreferences(): Promise<StoredPreferences> {
    return (await this.userData.readOne(undefined)) ?? this.defaultPreferences;
  }

  getPreferences(): StoredPreferences {
    return {
      ...this.defaults,
      ...this.defaultPreferences,
      ...this.preferences,
      ...this.overrides,
    };
  }

  async updatePreferences(
    attributes: Partial<z.input<StoredPreferencesValidator>>
  ) {
    await this.writePreferences({
      ...(await this.readPreferences()),
      ...attributes,
    });

    this.preferences = await this.readPreferences();
  }
}
