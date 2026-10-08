import { translate } from '@mongodb-js/compass-components';
import { defaultPreferencesInstance } from 'compass-preferences-model';

export function t(
  key: string,
  english: string,
  vars?: Record<string, string | number>
): string {
  return translate(
    defaultPreferencesInstance.getPreferences().language ?? 'en',
    key,
    english,
    vars
  );
}
