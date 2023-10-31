import preferences, { preferencesAccess, usePreference } from '.';
import type { AllPreferences, ParsedGlobalPreferencesResult } from '.';
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

/**
 * Helper method to check whether or not AI feature is enabled in Compass. The
 * feature is considered enabled if:
 *  - AI feature flag is enabled
 *  - config preference that controls AI is enabled
 *  - mms backend rollout enabled feature for the compass user
 */
export function isAIFeatureEnabled(
  preferences: Pick<
    AllPreferences,
    | 'enableGenAIFeatures'
    | 'enableGenAIExperience'
    | 'cloudFeatureRolloutAccess'
  > = preferencesAccess.getPreferences()
) {
  const {
    // a "kill switch" property from configuration file to be able to disable
    // feature in global config
    enableGenAIFeatures,
    // feature flag
    enableGenAIExperience,
    // based on mms backend rollout response
    cloudFeatureRolloutAccess,
  } = preferences;
  return (
    enableGenAIFeatures &&
    enableGenAIExperience &&
    !!cloudFeatureRolloutAccess?.GEN_AI_COMPASS
  );
}

export function useIsAIFeatureEnabled(React: ReactHooks) {
  const enableGenAIFeatures = usePreference('enableGenAIFeatures', React);
  const enableGenAIExperience = usePreference('enableGenAIExperience', React);
  const cloudFeatureRolloutAccess = usePreference(
    'cloudFeatureRolloutAccess',
    React
  );

  return isAIFeatureEnabled({
    enableGenAIFeatures,
    enableGenAIExperience,
    cloudFeatureRolloutAccess,
  });
}
