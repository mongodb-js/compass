import { promisifyAmpersandMethod } from '@mongodb-js/compass-utils';
import Preferences from 'compass-preferences-model';
import type { THEMES } from 'compass-preferences-model';

export type UserPreferences = {
  /**
   * Has the settings dialog has been shown before
   */
  showedNetworkOptIn: boolean;
  autoUpdates: boolean;
  enableMaps: boolean;
  trackErrors: boolean;
  trackUsageStatistics: boolean;
  enableFeedbackPanel: boolean;
  theme: THEMES.DARK | THEMES.LIGHT | THEMES.OS_THEME;
};

type UpdateRecord = { [P in keyof UserPreferences]?: boolean | string };

export const fetchPreferences = async (): Promise<UserPreferences> => {
  const model = new Preferences();
  const fetch = promisifyAmpersandMethod(model.fetch.bind(model));
  const preferences: UserPreferences = ((await fetch()) as any).getAttributes(
    { props: true },
    true
  );

  // Not a first time user. Return saved preferences
  if (preferences.showedNetworkOptIn) {
    return preferences;
  }

  // First time user.
  await _updateDefaultPreferences();
  return ((await fetch()) as any).getAttributes({ props: true }, true);
};

const _updateDefaultPreferences = async () => {
  // Set the defaults and also update showedNetworkOptIn flag
  const defaults: UpdateRecord = {
    autoUpdates: true,
    enableMaps: true,
    trackErrors: true,
    trackUsageStatistics: true,
    enableFeedbackPanel: true,
    showedNetworkOptIn: true,
  };
  return updatePreferences(defaults);
};

export const updatePreferences = async (
  attributes: UpdateRecord
): Promise<void> => {
  const model = new Preferences();
  await (promisifyAmpersandMethod(model.fetch.bind(model)) as any)();
  await (promisifyAmpersandMethod(model.save.bind(model)) as any)(attributes);
};
