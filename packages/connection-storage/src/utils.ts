import ConnectionString from 'mongodb-connection-string-url';
import { getAppName } from '@mongodb-js/compass-utils';

import type {
  ConnectionInfo,
  ConnectionSecrets,
} from '@mongodb-js/connection-info';

export function getKeytarServiceName() {
  const namespace = 'Connections';
  return `${getAppName()}/${namespace}`;
}

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

export const parseStoredPassword = (
  password: string
): ConnectionSecrets | undefined => {
  try {
    return JSON.parse(password).secrets;
  } catch {
    return undefined;
  }
};
