import { translate, type TranslateFn } from '@mongodb-js/compass-components';
import type { PreferencesAccess } from 'compass-preferences-model/provider';

export const translateEnglish: TranslateFn = (key, english, vars) =>
  translate('en', key, english, vars);

export function getTranslator(preferences: PreferencesAccess): TranslateFn {
  return (key, english, vars) =>
    translate(
      preferences?.getPreferences?.().language ?? 'en',
      key,
      english,
      vars
    );
}
