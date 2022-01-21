import { AuthMechanism } from 'mongodb';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';
import type { MongoClientOptions } from 'mongodb';

import { ConnectionFormError } from './validation';

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
  const updatedConnectionString = connectionStringUrl.clone();
  const updatedSearchParams =
    updatedConnectionString.typedSearchParams<MongoClientOptions>();

  if (!action.authMechanism) {
    updatedSearchParams.delete('authMechanism');
  } else {
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
  try {
    const updatedConnectionString = connectionStringUrl.clone();

    updatedConnectionString.username = action.username;

    // This will throw if the connection string is invalid
    new ConnectionStringUrl(updatedConnectionString.toString());

    return {
      connectionOptions: {
        ...connectionOptions,
        connectionString: updatedConnectionString.toString(),
      },
    };
  } catch (err) {
    return {
      connectionOptions,
      errors: [
        {
          fieldName: 'username',
          message: action.username
            ? `Username cannot be empty: "${(err as Error).message}"`
            : (err as Error).message,
        },
      ],
    };
  }
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
  try {
    const updatedConnectionString = connectionStringUrl.clone();

    updatedConnectionString.password = action.password;

    // This will throw if the connection string is invalid
    new ConnectionStringUrl(updatedConnectionString.toString());

    return {
      connectionOptions: {
        ...connectionOptions,
        connectionString: updatedConnectionString.toString(),
      },
    };
  } catch (err) {
    return {
      connectionOptions,
      errors: connectionStringUrl.username
        ? [
            {
              fieldName: 'password',
              message: (err as Error).message,
            },
          ]
        : [
            {
              fieldName: 'username',
              message: `Username cannot be empty: "${(err as Error).message}"`,
            },
            {
              fieldName: 'password',
              message: 'Please enter a username first',
            },
          ],
    };
  }
}
