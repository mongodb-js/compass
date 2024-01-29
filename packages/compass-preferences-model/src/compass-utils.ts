import type { ParsedGlobalPreferencesResult } from './global-config';
import type { PreferencesAccess } from './preferences';
import type { UserStorage } from './user-storage';
import { UserStorageImpl } from './user-storage';
import { getActiveUserId } from './utils';
import { setupPreferences } from './setup-preferences';

export async function setupPreferencesAndUser(
  globalPreferences: ParsedGlobalPreferencesResult
): Promise<{ userStorage: UserStorage; preferences: PreferencesAccess }> {
  const preferences = await setupPreferences(globalPreferences);
  const userStorage = new UserStorageImpl();
  const user = await userStorage.getOrCreate(getActiveUserId(preferences));
  // update user id (telemetryAnonymousId) in preferences if new user was created.
  await preferences.savePreferences({ telemetryAnonymousId: user.id });
  await userStorage.updateUser(user.id, {
    lastUsed: new Date(),
  });
  return { preferences, userStorage };
}
