import { usePreference } from './react';
import type { AllPreferences, PreferencesAccess, User } from '.';
import type { UserStorage } from './storage';

export function getActiveUserId(
  preferences: PreferencesAccess
): string | undefined {
  const { currentUserId, telemetryAnonymousId } = preferences.getPreferences();
  return currentUserId || telemetryAnonymousId;
}

export async function getActiveUser(
  preferences: PreferencesAccess,
  userStorage: UserStorage
): Promise<User> {
  const userId = getActiveUserId(preferences);
  if (!userId) {
    throw new Error('User not setup.');
  }
  return userStorage.getUser(userId);
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
    'enableGenAIFeatures' | 'cloudFeatureRolloutAccess'
  >
) {
  const {
    // a "kill switch" property from configuration file to be able to disable
    // feature in global config
    enableGenAIFeatures,
    // based on mms backend rollout response
    cloudFeatureRolloutAccess,
  } = preferences;
  return enableGenAIFeatures && !!cloudFeatureRolloutAccess?.GEN_AI_COMPASS;
}

export function useIsAIFeatureEnabled() {
  const enableGenAIFeatures = usePreference('enableGenAIFeatures');
  const cloudFeatureRolloutAccess = usePreference('cloudFeatureRolloutAccess');

  return isAIFeatureEnabled({
    enableGenAIFeatures,
    cloudFeatureRolloutAccess,
  });
}
