import { type z, AtlasUserData } from '@mongodb-js/compass-user-data';
import type { AtlasServiceLike } from '@mongodb-js/compass-user-data';
import {
  getDefaultsForStoredPreferences,
  getPreferencesValidator,
} from './preferences-schema';
import type {
  StoredPreferences,
  StoredPreferencesValidator,
} from './preferences-schema';

import type { PreferencesStorage } from './preferences-storage';

export class AtlasPreferencesStorage implements PreferencesStorage {
  private readonly file = 'General';
  private readonly defaultPreferences = getDefaultsForStoredPreferences();
  private readonly userData: AtlasUserData<
    StoredPreferencesValidator,
    'AppPreferences'
  >;
  private preferences: StoredPreferences = getDefaultsForStoredPreferences();

  constructor(atlasService: AtlasServiceLike) {
    this.userData = new AtlasUserData(
      getPreferencesValidator(),
      'AppPreferences',
      {
        atlasService,
      }
    );
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
      ...this.defaultPreferences,
      ...this.preferences,
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
