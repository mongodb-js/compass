import ConnectionString from 'mongodb-connection-string-url';
import type { ConnectionInfo } from './connection-info';

type ConnectionInfoForTitle = Pick<
  ConnectionInfo,
  'favorite' | 'connectionOptions' | 'atlasMetadata'
>;

const ConnectionInfoTitleCache = new WeakMap<ConnectionInfoForTitle, string>();

/**
 * Returns the title for connection info. It is called often in various parts of
 * the application, including render methods, so to save some runtime, the
 * result is cached based on the connection info value by referece
 */
export function getConnectionTitle(info: ConnectionInfoForTitle): string {
  let title = ConnectionInfoTitleCache.get(info);

  if (title) {
    return title;
  }

  if (info.atlasMetadata?.clusterName) {
    title = info.atlasMetadata.clusterName;
  } else if (info.favorite?.name) {
    title = info.favorite.name;
  } else {
    try {
      const url = new ConnectionString(info.connectionOptions.connectionString);
      title = url.hosts.join(',');
    } catch (e) {
      // When parsing a connection for its title fails we default the title.
      title = info.connectionOptions.connectionString || 'Connection';
    }
  }

  ConnectionInfoTitleCache.set(info, title);
  return title;
}
