import ConnectionString from 'mongodb-connection-string-url';

import type { ConnectionInfo } from '@mongodb-js/connection-info';

export function deleteCompassAppNameParam(
  connectionInfo: ConnectionInfo
): ConnectionInfo {
  let connectionStringUrl;

  try {
    connectionStringUrl = new ConnectionString(
      connectionInfo.connectionOptions.connectionString
    );
  } catch {
    return connectionInfo;
  }

  if (
    /^mongodb compass/i.exec(
      connectionStringUrl.searchParams.get('appName') || ''
    )
  ) {
    connectionStringUrl.searchParams.delete('appName');
  }

  return {
    ...connectionInfo,
    connectionOptions: {
      ...connectionInfo.connectionOptions,
      connectionString: connectionStringUrl.href,
    },
  };
}
