import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';
import type { MongoClientOptions } from 'mongodb';

import { TLS_OPTIONS } from '../constants/ssl-tls-options';
import { ConnectionFormError } from './validation';

export function handleUpdateTlsOption({
  tlsOption,
  connectionStringUrl,
  connectionOptions,
}: {
  tlsOption: TLS_OPTIONS;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
}): {
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
  errors: ConnectionFormError[];
} {
  const updatedConnectionString = connectionStringUrl.clone();
  const updatedSearchParams =
    updatedConnectionString.typedSearchParams<MongoClientOptions>();

  if (tlsOption === 'ON') {
    updatedSearchParams.delete('ssl');
    updatedSearchParams.set('tls', 'true');
  } else if (tlsOption === 'OFF') {
    updatedSearchParams.delete('ssl');
    updatedSearchParams.set('tls', 'false');
  } else if (tlsOption === 'DEFAULT') {
    updatedSearchParams.delete('ssl');
    updatedSearchParams.delete('tls');
  }

  return {
    errors: [],
    connectionStringUrl: updatedConnectionString,
    connectionOptions: {
      ...connectionOptions,
      connectionString: updatedConnectionString.toString(),
    },
  };
}
