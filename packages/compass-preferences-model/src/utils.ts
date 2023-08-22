import preferences, { preferencesAccess } from '.';
import type { ParsedGlobalPreferencesResult } from '.';
import { setupPreferences } from './setup-preferences';
import { UserStorage } from './storage';
import { getStoragePaths } from '@mongodb-js/compass-utils';

export async function setupPreferencesAndUser(
  globalPreferences: ParsedGlobalPreferencesResult
): Promise<void> {
  await setupPreferences(globalPreferences);
  const userStorage = new UserStorage(getStoragePaths()?.basepath);
  const user = await userStorage.getOrCreate(getActiveUserId());
  // update user id (telemetryAnonymousId) in preferences if new user was created.
  await preferences.savePreferences({ telemetryAnonymousId: user.id });
  await userStorage.updateUser(user.id, {
    lastUsed: new Date(),
  });
}

function getActiveUserId() {
  const { currentUserId, telemetryAnonymousId } = preferences.getPreferences();
  return currentUserId || telemetryAnonymousId;
}

export async function getActiveUser() {
  const userStorage = new UserStorage(getStoragePaths()?.basepath);
  return userStorage.getUser(getActiveUserId());
}

export function capMaxTimeMSAtPreferenceLimit<T>(value: T): T | number {
  const preferenceMaxTimeMS = preferencesAccess.getPreferences().maxTimeMS;
  if (typeof value === 'number' && typeof preferenceMaxTimeMS === 'number') {
    return Math.min(value, preferenceMaxTimeMS);
  } else if (typeof preferenceMaxTimeMS === 'number') {
    return preferenceMaxTimeMS;
  }
  return value;
}
