import { promisifyAmpersandMethod } from 'mongodb-data-service';
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
  // Set the defaults
  await _updateDefaultPreferences();
  // update showedNetworkOptIn flag
  await updatePreference('showedNetworkOptIn', true);
  return ((await fetch()) as any).getAttributes({ props: true }, true);
};

const _updateDefaultPreferences = async (): Promise<void> => {
  const defaults = {
    autoUpdates: true,
    enableMaps: true,
    trackErrors: true,
    trackUsageStatistics: true,
    enableFeedbackPanel: true,
  };
  const model = new Preferences();
  await (promisifyAmpersandMethod(model.fetch.bind(model)) as any)();
  await (promisifyAmpersandMethod(model.save.bind(model)) as any)(defaults);
};

export const updatePreference = async (
  key: keyof UserPreferences,
  value: boolean | string
): Promise<void> => {
  const model = new Preferences();
  const fetch = promisifyAmpersandMethod(model.fetch.bind(model));
  await fetch();

  model.set(key, value);

  const save = promisifyAmpersandMethod(model.save.bind(model));
  await (save as any)(model);
};
