import { promisifyAmpersandMethod } from 'mongodb-data-service';
import Preferences from 'compass-preferences-model';
import type { THEMES } from 'compass-preferences-model';

export type UserPreferences = {
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
  const settings = await fetch();
  return (settings as any).getAttributes({ props: true }, true);
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
