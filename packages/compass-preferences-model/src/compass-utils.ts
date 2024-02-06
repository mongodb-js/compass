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
  // update user info (telemetryAnonymousId and userCreatedAt) in preferences to
  // make sure user info is in sync between preferences and UserStorage and can
  // be accessed in renderer without the need to use UserStorage directly (we
  // can't access the same UserStorage instance in renderer)
  await preferences.savePreferences({
    telemetryAnonymousId: user.id,
    userCreatedAt: user.createdAt.getTime(),
  });
  await userStorage.updateUser(user.id, {
    lastUsed: new Date(),
  });
  return { preferences, userStorage };
}
