import { AuthMechanism } from 'mongodb';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';
import type { MongoClientOptions } from 'mongodb';

import { ConnectionFormError, tryToParseConnectionString } from './validation';

export type UpdateAuthMechanismAction = {
  type: 'update-auth-mechanism';
  authMechanism: AuthMechanism | null;
};

export type UpdateUsernameAction = {
  type: 'update-username';
  username: string;
};
export type UpdatePasswordAction = {
  type: 'update-password';
  password: string;
};

export function getConnectionUrlWithoutAuth(
  connectionStringUrl: ConnectionStringUrl
): ConnectionStringUrl {
  const updatedConnectionString = connectionStringUrl.clone();
  const updatedSearchParams =
    updatedConnectionString.typedSearchParams<MongoClientOptions>();

  updatedSearchParams.delete('authMechanism');

  // Wipe any existing auth options on the connection.
  updatedConnectionString.password = '';
  updatedConnectionString.username = '';

  updatedSearchParams.delete('authMechanismProperties');
  // `gssapiServiceName` is a legacy option now set with `authMechanismProperties`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedSearchParams.delete('gssapiServiceName' as any);
  updatedSearchParams.delete('authSource');

  return updatedConnectionString;
}

export function handleUpdateAuthMechanism({
  action,
  connectionStringUrl,
  connectionOptions,
}: {
  action: UpdateAuthMechanismAction;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
  errors?: ConnectionFormError[];
} {
  const updatedConnectionString =
    getConnectionUrlWithoutAuth(connectionStringUrl);
  const updatedSearchParams =
    updatedConnectionString.typedSearchParams<MongoClientOptions>();

  if (action.authMechanism) {
    updatedSearchParams.set('authMechanism', action.authMechanism);
  }

  return {
    connectionOptions: {
      ...connectionOptions,
      connectionString: updatedConnectionString.toString(),
    },
  };
}

export function handleUpdateUsername({
  action,
  connectionStringUrl,
  connectionOptions,
}: {
  action: UpdateUsernameAction;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
  errors?: ConnectionFormError[];
} {
  const updatedConnectionString = connectionStringUrl.clone();

  updatedConnectionString.username = encodeURIComponent(action.username);

  const [, parsingError] = tryToParseConnectionString(
    updatedConnectionString.toString()
  );

  if (parsingError) {
    return {
      connectionOptions,
      errors: [
        {
          fieldName: 'username',
          message: action.username
            ? parsingError.message
            : `Username cannot be empty: "${parsingError.message}"`,
        },
      ],
    };
  }

  return {
    connectionOptions: {
      ...connectionOptions,
      connectionString: updatedConnectionString.toString(),
    },
  };
}

export function handleUpdatePassword({
  action,
  connectionStringUrl,
  connectionOptions,
}: {
  action: UpdatePasswordAction;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
}): {
  connectionOptions: ConnectionOptions;
  errors?: ConnectionFormError[];
} {
  const updatedConnectionString = connectionStringUrl.clone();

  updatedConnectionString.password = encodeURIComponent(action.password);

  const [, parsingError] = tryToParseConnectionString(
    updatedConnectionString.toString()
  );

  if (parsingError) {
    return {
      connectionOptions,
      errors: connectionStringUrl.username
        ? [
            {
              fieldName: 'password',
              message: parsingError.message,
            },
          ]
        : [
            {
              fieldName: 'username',
              message: `Username cannot be empty: "${parsingError.message}"`,
            },
            {
              fieldName: 'password',
              message: 'Please enter a username first',
            },
          ],
    };
  }

  return {
    connectionOptions: {
      ...connectionOptions,
      connectionString: updatedConnectionString.toString(),
    },
  };
}
