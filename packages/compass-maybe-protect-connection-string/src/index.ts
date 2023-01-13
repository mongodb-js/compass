import preferences from 'compass-preferences-model';
import { redactConnectionString } from 'mongodb-connection-string-url';

export function maybeProtectConnectionString(connectionString: string): string {
  if (preferences.getPreferences().protectConnectionStrings) {
    return redactConnectionString(connectionString);
  }
  return connectionString;
}
