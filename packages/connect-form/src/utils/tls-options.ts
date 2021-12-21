import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';

import { TLS_OPTIONS } from '../constants/ssl-tls-options';
import { ConnectionFormError } from '../utils/connect-form-errors';

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

  if (tlsOption === 'ON') {
    updatedConnectionString.searchParams.delete('ssl');
    updatedConnectionString.searchParams.set('tls', 'true');
  } else if (tlsOption === 'OFF') {
    updatedConnectionString.searchParams.delete('ssl');
    updatedConnectionString.searchParams.set('tls', 'false');
  } else if (tlsOption === 'DEFAULT') {
    updatedConnectionString.searchParams.delete('ssl');
    updatedConnectionString.searchParams.delete('tls');
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
