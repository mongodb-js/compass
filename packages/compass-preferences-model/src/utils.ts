import preferences, { preferencesAccess, usePreference } from '.';
import type { ParsedGlobalPreferencesResult } from '.';
import { setupPreferences } from './setup-preferences';
import { UserStorage } from './storage';
import type { ReactHooks } from './react';

export async function setupPreferencesAndUser(
  globalPreferences: ParsedGlobalPreferencesResult
): Promise<void> {
  await setupPreferences(globalPreferences);
  const userStorage = new UserStorage();
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
  const userStorage = new UserStorage();
  const userId = getActiveUserId();
  if (!userId) {
    throw new Error('User not setup.');
  }
  return userStorage.getUser(userId);
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

export function useIsAIFeatureEnabled(React: ReactHooks) {
  const enableAIExperience = usePreference('enableAIExperience', React);
  const isAIFeatureEnabled = usePreference(
    'cloudFeatureRolloutAccess',
    React
  )?.GEN_AI_COMPASS;
  const enableAIFeatures = usePreference('enableAIFeatures', React);

  return enableAIExperience && isAIFeatureEnabled && enableAIFeatures;
}
