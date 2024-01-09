import { usePreference } from '.';
import type {
  AllPreferences,
  ParsedGlobalPreferencesResult,
  PreferencesAccess,
  User,
} from '.';
import { setupPreferences } from './setup-preferences';
import type { UserStorage } from './storage';
import { UserStorageImpl } from './storage';

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

function getActiveUserId(preferences: PreferencesAccess): string | undefined {
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
