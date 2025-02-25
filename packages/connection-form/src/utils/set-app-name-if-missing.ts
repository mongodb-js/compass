import { cloneDeep } from 'lodash';
import type { MongoClientOptions } from 'mongodb';
import { ConnectionString } from 'mongodb-connection-string-url';
import type { ConnectionOptions } from 'mongodb-data-service';

export function setAppNameParamIfMissing({
  defaultAppName,
  telemetryAnonymousId,
  connectionId,
}: {
  defaultAppName?: string;
  telemetryAnonymousId?: string;
  connectionId: string;
}): (connectionOptions: Readonly<ConnectionOptions>) => ConnectionOptions {
  return (connectionOptions) => {
    const connectionStringUrl = new ConnectionString(
      connectionOptions.connectionString
    );

    const searchParams =
      connectionStringUrl.typedSearchParams<MongoClientOptions>();
    if (!searchParams.has('appName') && defaultAppName !== undefined) {
      const appName = `${defaultAppName}${
        telemetryAnonymousId ? `-${telemetryAnonymousId}` : ''
      }-${connectionId}`;

      searchParams.set('appName', appName);
      connectionOptions = {
        ...cloneDeep(connectionOptions),
        connectionString: connectionStringUrl.toString(),
      };
    }

    return connectionOptions;
  };
}
