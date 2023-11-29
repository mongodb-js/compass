import { ConnectionString } from 'mongodb-connection-string-url';
import type { ConnectionOptions } from 'mongodb-data-service';

function isSpecialKey(key: string): key is 'username' | 'password' {
  return key === 'username' || key === 'password';
}

export function applyForceConnectionOptions(
  forceConnectionOptions: [key: string, value: string][] = []
) {
  return (options: Readonly<ConnectionOptions>): ConnectionOptions => {
    const url = new ConnectionString(options.connectionString);

    for (const [key] of forceConnectionOptions) {
      if (isSpecialKey(key)) continue;
      url.searchParams.delete(key);
    }
    for (const [key, value] of forceConnectionOptions) {
      if (isSpecialKey(key)) url[key] = encodeURIComponent(value);
      else url.searchParams.append(key, value);
    }

    return {
      ...options,
      connectionString: url.toString(),
    };
  };
}
