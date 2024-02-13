import ConnectionString from 'mongodb-connection-string-url';
import type { ConnectionInfo } from './connection-info';

export function getConnectionTitle(
  info: Pick<ConnectionInfo, 'name' | 'connectionOptions'>
): string {
  if (info.name) {
    return info.name;
  }

  try {
    const url = new ConnectionString(info.connectionOptions.connectionString);
    return url.hosts.join(',');
  } catch (e) {
    // When parsing a connection for its title fails we default the title.
    return info.connectionOptions.connectionString || 'Connection';
  }
}
