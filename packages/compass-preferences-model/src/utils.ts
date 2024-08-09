import { usePreference } from './react';
import type { AllPreferences, PreferencesAccess, User } from '.';
import type { DevtoolsProxyOptions } from '@mongodb-js/devtools-proxy-support';

export function getActiveUserId(
  preferences: Pick<PreferencesAccess, 'getPreferences'>
): string | undefined {
  const { currentUserId, telemetryAnonymousId } = preferences.getPreferences();
  return currentUserId || telemetryAnonymousId;
}

export function getActiveUser(
  preferences: Pick<PreferencesAccess, 'getPreferences'>
): Pick<User, 'id' | 'createdAt'> {
  const userId = getActiveUserId(preferences);
  const { userCreatedAt } = preferences.getPreferences();
  if (!userId) {
    throw new Error('User not setup.');
  }
  return { id: userId, createdAt: new Date(userCreatedAt) };
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

export function useHasAIFeatureCloudRolloutAccess() {
  const cloudFeatureRolloutAccess = usePreference('cloudFeatureRolloutAccess');
  return !!cloudFeatureRolloutAccess?.GEN_AI_COMPASS;
}

export function proxyPreferenceToProxyOptions(
  proxy: string
): DevtoolsProxyOptions {
  if (!proxy)
    return {
      useEnvironmentVariableProxies: true,
    };
  try {
    return JSON.parse(proxy);
  } catch {
    return { proxy: new URL(proxy).href, useEnvironmentVariableProxies: true };
  }
}

export function proxyOptionsToProxyPreference(
  proxyOptions: DevtoolsProxyOptions
): string {
  return JSON.stringify(proxyOptions);
}
