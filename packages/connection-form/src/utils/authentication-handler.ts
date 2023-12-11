import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { ConnectionOptions } from 'mongodb-data-service';
import type { AuthMechanism, MongoClientOptions } from 'mongodb';

import type { ConnectionFormError } from './validation';
import {
  setConnectionStringPassword,
  setConnectionStringUsername,
  tryToParseConnectionString,
} from './connection-string-helpers';
import { cloneDeep } from 'lodash';

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
    if (
      ['MONGODB-AWS', 'GSSAPI', 'PLAIN', 'MONGODB-X509'].includes(
        action.authMechanism
      )
    ) {
      updatedSearchParams.set('authSource', '$external');
    }
  }

  return {
    connectionOptions: {
      ...cloneDeep(connectionOptions),
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
  const updatedConnectionString = setConnectionStringUsername(
    connectionStringUrl,
    action.username
  );

  const [, parsingError] = tryToParseConnectionString(
    updatedConnectionString.toString()
  );

  if (parsingError) {
    return {
      connectionOptions,
      errors: [
        {
          fieldName: 'username',
          fieldTab: 'authentication',
          message: parsingError.message,
        },
      ],
    };
  }

  return {
    connectionOptions: {
      ...cloneDeep(connectionOptions),
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
  const updatedConnectionString = setConnectionStringPassword(
    connectionStringUrl,
    action.password
  );

  const [, parsingError] = tryToParseConnectionString(
    updatedConnectionString.toString()
  );

  if (parsingError) {
    return {
      connectionOptions,
      errors: [
        {
          fieldName: 'password',
          fieldTab: 'authentication',
          message: parsingError.message,
        },
      ],
    };
  }

  return {
    connectionOptions: {
      ...cloneDeep(connectionOptions),
      connectionString: updatedConnectionString.toString(),
    },
  };
}
