import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';
import type { MongoClientOptions } from 'mongodb';

export type TLS_OPTIONS = 'DEFAULT' | 'ON' | 'OFF';
export interface UpdateTlsOptionAction {
  type: 'update-tls-option';
  tlsOption: TLS_OPTIONS;
}

export function handleUpdateTlsOption({
  action,
  connectionStringUrl,
  connectionOptions,
}: {
  action: UpdateTlsOptionAction;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
} {
  const updatedConnectionString = connectionStringUrl.clone();
  const updatedSearchParams =
    updatedConnectionString.typedSearchParams<MongoClientOptions>();

  if (action.tlsOption === 'ON') {
    updatedSearchParams.delete('ssl');
    updatedSearchParams.set('tls', 'true');
  } else if (action.tlsOption === 'OFF') {
    updatedSearchParams.delete('ssl');
    updatedSearchParams.set('tls', 'false');
  } else if (action.tlsOption === 'DEFAULT') {
    updatedSearchParams.delete('ssl');
    updatedSearchParams.delete('tls');
  }

  return {
    connectionOptions: {
      ...connectionOptions,
      connectionString: updatedConnectionString.toString(),
    },
  };
}
