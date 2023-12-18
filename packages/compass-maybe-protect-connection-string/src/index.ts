import { usePreference } from 'compass-preferences-model';
import { redactConnectionString } from 'mongodb-connection-string-url';

export function maybeProtectConnectionString(
  protectConnectionStrings: boolean | undefined,
  connectionString: string
): string {
  if (protectConnectionStrings) {
    return redactConnectionString(connectionString);
  }
  return connectionString;
}

export function useMaybeProtectConnectionString(): (
  connectionString: string
) => string {
  const protectConnectionStrings = usePreference('protectConnectionStrings');
  return (connectionString: string) =>
    maybeProtectConnectionString(protectConnectionStrings, connectionString);
}
