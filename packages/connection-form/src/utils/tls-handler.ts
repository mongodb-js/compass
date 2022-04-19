import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { ConnectionOptions } from 'mongodb-data-service';
import type { MongoClientOptions } from 'mongodb';
import { cloneDeep } from 'lodash';

export type TLS_OPTIONS = 'DEFAULT' | 'ON' | 'OFF';
export type TLSOptionName =
  | keyof Pick<
      MongoClientOptions,
      | 'tlsCAFile'
      | 'tlsCertificateKeyFile'
      | 'tlsCertificateKeyFilePassword'
      | 'tlsInsecure'
      | 'tlsAllowInvalidHostnames'
      | 'tlsAllowInvalidCertificates'
    >
  | 'useSystemCA';
export interface UpdateTlsAction {
  type: 'update-tls';
  tlsOption: TLS_OPTIONS;
}

export interface UpdateTlsOptionAction {
  type: 'update-tls-option';
  key: TLSOptionName;
  value?: string | null;
}

export function handleUpdateTls({
  action,
  connectionStringUrl,
  connectionOptions,
}: {
  action: UpdateTlsAction;
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
      ...cloneDeep(connectionOptions),
      connectionString: updatedConnectionString.toString(),
    },
  };
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
  const updatedConnectionOptions = cloneDeep(connectionOptions);
  const updatedConnectionString = connectionStringUrl.clone();
  const updatedSearchParams =
    updatedConnectionString.typedSearchParams<MongoClientOptions>();

  if (action.key === 'useSystemCA') {
    if (action.value) {
      updatedSearchParams.delete('tlsCAFile');
      updatedConnectionOptions.useSystemCA = true;
    } else {
      delete updatedConnectionOptions.useSystemCA;
    }
  } else if (!action.value) {
    updatedSearchParams.delete(action.key);
  } else {
    // When setting an option, we set tls to true
    // if it isn't already set.
    updatedSearchParams.delete('ssl');
    updatedSearchParams.set('tls', 'true');

    updatedSearchParams.set(action.key, action.value);

    if (action.key === 'tlsCAFile') {
      delete updatedConnectionOptions.useSystemCA;
    }
  }

  return {
    connectionOptions: {
      ...updatedConnectionOptions,
      connectionString: updatedConnectionString.toString(),
    },
  };
}
