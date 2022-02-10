import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { defaultHostname, defaultPort } from '../constants/default-connection';

function updateConnectionStringToStandard(
  connectionStringUrl: ConnectionStringUrl
): ConnectionStringUrl {
  if (!connectionStringUrl.isSRV) {
    // Already is standard schema, nothing to do.
    return connectionStringUrl;
  }

  const newConnectionStringUrl = connectionStringUrl.clone();
  newConnectionStringUrl.protocol = 'mongodb:';

  newConnectionStringUrl.hosts = [
    `${newConnectionStringUrl.hosts[0]}:${defaultPort}`,
  ];

  return newConnectionStringUrl;
}

function updateConnectionStringToSRV(
  connectionStringUrl: ConnectionStringUrl
): ConnectionStringUrl {
  if (connectionStringUrl.isSRV) {
    // Already is srv schema, nothing to do.
    return connectionStringUrl;
  }

  const newConnectionStringUrl = connectionStringUrl.clone();

  // Only include one host without port.
  const newHost =
    newConnectionStringUrl.hosts.length > 0
      ? newConnectionStringUrl.hosts[0].substring(
          0,
          newConnectionStringUrl.hosts[0].indexOf(':') === -1
            ? undefined
            : newConnectionStringUrl.hosts[0].indexOf(':')
        )
      : defaultHostname;
  newConnectionStringUrl.hosts = [newHost];

  newConnectionStringUrl.protocol = 'mongodb+srv:';
  const searchParams =
    newConnectionStringUrl.typedSearchParams<MongoClientOptions>();

  // SRV connections can't have directConnection set.
  if (searchParams.get('directConnection')) {
    searchParams.delete('directConnection');
  }

  return newConnectionStringUrl;
}

// Note: This method can throw when it cannot be changed.
export function tryUpdateConnectionStringSchema(
  connectionStringUrl: ConnectionStringUrl,
  setIsSrv: boolean
): ConnectionStringUrl {
  if (!setIsSrv) {
    return updateConnectionStringToStandard(connectionStringUrl);
  } else {
    return updateConnectionStringToSRV(connectionStringUrl);
  }
}
