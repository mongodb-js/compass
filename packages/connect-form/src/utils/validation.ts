import { ConnectionOptions } from 'mongodb-data-service';
import ConnectionString from 'mongodb-connection-string-url';

export function getConnectionString(
  connectionOptions: ConnectionOptions
): ConnectionString {
  return new ConnectionString(connectionOptions.connectionString);
}

export function isSecure(connectionString: ConnectionString): boolean {
  const sslParam = connectionString.searchParams.get('ssl');
  const tlsParam = connectionString.searchParams.get('tls');
  if (!sslParam && !tlsParam) {
    return connectionString.isSRV;
  }

  return sslParam === 'true' || tlsParam === 'true';
}
