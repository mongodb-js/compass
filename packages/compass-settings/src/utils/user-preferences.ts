import { promisifyAmpersandMethod } from 'mongodb-data-service';
import Preferences from 'compass-preferences-model';

export const getUserPreferences = async () => {
  const preferences = new Preferences();

  const fetch = promisifyAmpersandMethod(
    preferences.fetch.bind(preferences)
  );
  const settings = await fetch();
  return settings.getAttributes({ props: true }, true);
};