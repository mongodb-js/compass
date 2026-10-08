import { translate } from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';
import type { PreferencesAccess } from 'compass-preferences-model/provider';

export function getTranslate(preferences?: PreferencesAccess): TranslateFn {
  return (key, english, vars) =>
    translate(
      preferences?.getPreferences?.().language ?? 'en',
      key,
      english,
      vars
    );
}
