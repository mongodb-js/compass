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
  overrides?: Partial<AllPreferences>;
};

export class AtlasPreferencesStorage implements PreferencesStorage {
  private readonly defaultPreferences = getDefaultsForStoredPreferences();
  private readonly userData: AtlasUserData<
    StoredPreferencesValidator,
    'AppPreferences'
  >;
  private preferences: StoredPreferences = getDefaultsForStoredPreferences();
  private overrides: Partial<AllPreferences>;

  constructor(
    atlasService: AtlasServiceLike,
    { overrides = {} }: AtlasPreferencesStorageOptions = {}
  ) {
    this.userData = new AtlasUserData(
      getPreferencesValidator(),
      'AppPreferences',
      {
        atlasService,
      }
    );
    this.overrides = overrides;
  }

  async setup() {
    this.preferences = await this.readPreferences();
  }

  private async writePreferences(
    preferences: z.input<StoredPreferencesValidator>
  ): Promise<void> {
    await this.userData.write(preferences);
  }

  private async readPreferences(): Promise<StoredPreferences> {
    return (await this.userData.readOne()) ?? this.defaultPreferences;
  }

  getPreferences(): StoredPreferences {
    return {
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
