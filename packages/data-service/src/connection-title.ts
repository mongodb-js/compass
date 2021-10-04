import ConnectionString from 'mongodb-connection-string-url';
import { ConnectionInfo } from './connection-info';

export function getConnectionTitle(info: ConnectionInfo): string {
  if (info.favorite?.name) {
    return info.favorite.name;
  }

  const url = new ConnectionString(info.connectionOptions.connectionString);
  if (url.isSRV) {
    return url.hosts[0];
  }

  return url.hosts
    .map((hostname) => hostname.split(':'))
    .map(([host, port]) => (port ? `${host}:${port}` : `${host}`))
    .join(',');
}
