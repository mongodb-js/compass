import ConnectionString from 'mongodb-connection-string-url';
import { ConnectionOptions } from './connection-options';

export function getConnectionTitle(options: ConnectionOptions): string {
  if (options.favorite?.name) {
    return options.favorite.name;
  }

  const url = new ConnectionString(options.connectionString);
  if (url.isSRV && url.hosts.length === 1) {
    return url.hosts[0];
  }

  return url.hosts
    .map((hostname) => hostname.split(':'))
    .map(([host, port]) => (port ? `${host}:${port}` : `${host}`))
    .join(',');
}
