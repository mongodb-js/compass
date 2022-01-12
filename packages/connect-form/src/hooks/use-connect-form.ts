import { useEffect, useReducer } from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionInfo, ConnectionOptions } from 'mongodb-data-service';
import type { MongoClientOptions } from 'mongodb';

import { defaultConnectionString } from '../constants/default-connection';
import {
  ConnectionFormError,
  ConnectionFormWarning,
  validateConnectionOptionsWarnings,
} from '../utils/validation';
import { getNextHost } from '../utils/get-next-host';
import { defaultHostname, defaultPort } from '../constants/default-connection';
import { checkForInvalidCharacterInHost } from '../utils/check-for-invalid-character-in-host';
import { tryUpdateConnectionStringSchema } from '../utils/connection-string-schema';
import {
  handleUpdateSshOptions,
  UpdateSshOptions,
} from '../utils/connection-ssh-handler';
import { handleUpdateTlsOption } from '../utils/tls-options';
import { TLS_OPTIONS } from '../constants/ssl-tls-options';

export interface ConnectFormState {
  connectionStringInvalidError: string | null;
  connectionOptions: ConnectionOptions;
  connectionStringUrl: ConnectionStringUrl;

  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];
}

type Action =
  | {
      type: 'set-connection-string-error';
      errorMessage: string | null;
    }
  | {
      type: 'set-connection-string-url';
      connectionStringUrl: ConnectionStringUrl;
    }
  | {
      type: 'set-connection-string-state';
      newState: ConnectFormState;
    }
  | {
      type: 'set-form-errors';
      errors: ConnectionFormError[];
    };

function connectFormReducer(
  state: ConnectFormState,
  action: Action
): ConnectFormState {
  switch (action.type) {
    case 'set-connection-string-error':
      return {
        ...state,
        connectionStringInvalidError: action.errorMessage,
      };
    case 'set-connection-string-url':
      return {
        ...state,
        connectionStringUrl: action.connectionStringUrl,
        connectionStringInvalidError: null,
      };
    case 'set-connection-string-state':
      return {
        ...state,
        ...action.newState,
      };
    case 'set-form-errors':
      return {
        ...state,
        errors: action.errors,
      };
  }
}

interface UpdateHostAction {
  type: 'update-host';
  fieldIndex: number;
  newHostValue: string;
}

interface UpdateTlsOptionAction {
  type: 'update-tls-option';
  tlsOption: TLS_OPTIONS;
}

type ConnectionFormFieldActions =
  | {
      type: 'add-new-host';
      fieldIndexToAddAfter: number;
    }
  | {
      type: 'remove-host';
      fieldIndexToRemove: number;
    }
  | UpdateHostAction
  | {
      type: 'update-direct-connection';
      isDirectConnection: boolean;
    }
  | {
      type: 'update-connection-schema';
      isSrv: boolean;
    }
  | UpdateSshOptions
  | UpdateTlsOptionAction
  | {
      type: 'update-search-param';
      currentKey: keyof MongoClientOptions;
      newKey?: keyof MongoClientOptions;
      value?: unknown;
    }
  | {
      type: 'delete-search-param';
      key: keyof MongoClientOptions;
    }
  | {
      type: 'update-connection-path';
      value: string;
    };

export type UpdateConnectionFormField = (
  action: ConnectionFormFieldActions
) => void;

function buildStateFromConnectionInfo(
  initialConnectionInfo: ConnectionInfo
): ConnectFormState {
  let connectionStringInvalidError = null;
  let connectionStringUrl = new ConnectionStringUrl(defaultConnectionString);
  try {
    connectionStringUrl = new ConnectionStringUrl(
      initialConnectionInfo.connectionOptions.connectionString
    );
  } catch (error) {
    connectionStringInvalidError = (error as Error).message;
  }

  const connectionOptions = {
    ...initialConnectionInfo.connectionOptions,
  };

  return {
    errors: [],
    warnings: validateConnectionOptionsWarnings(connectionOptions),

    connectionStringInvalidError,
    connectionStringUrl,
    connectionOptions,
  };
}

function handleUpdateHost({
  action,
  connectionStringUrl,
  connectionOptions,
}: {
  action: UpdateHostAction;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
}): {
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
  errors: ConnectionFormError[];
} {
  const { newHostValue, fieldIndex } = action;
  try {
    checkForInvalidCharacterInHost(newHostValue, connectionStringUrl.isSRV);

    if (connectionStringUrl.hosts.length === 1 && newHostValue === '') {
      throw new Error(
        'Host cannot be empty. The host is the address hostname, IP address, or UNIX domain socket where the mongodb instance is running.'
      );
    }

    const updatedConnectionString = connectionStringUrl.clone();
    updatedConnectionString.hosts[fieldIndex] = newHostValue || '';

    // Build a new connection string url to ensure the
    // validity of the update.
    const newConnectionStringUrl = new ConnectionStringUrl(
      updatedConnectionString.toString()
    );

    return {
      connectionStringUrl: newConnectionStringUrl,
      connectionOptions: {
        ...connectionOptions,
        connectionString: newConnectionStringUrl.toString(),
      },
      errors: [],
    };
  } catch (err) {
    // The host value is invalid, so we show the error and allow
    // the user to update it until we can update the
    // connection string url.
    return {
      connectionStringUrl,
      connectionOptions: {
        ...connectionOptions,
        connectionString: connectionStringUrl.toString(),
      },
      errors: [
        {
          fieldName: 'hosts',
          fieldIndex,
          message: (err as Error).message,
        },
      ],
    };
  }
}

// This function handles field updates from the connection form.
// It performs validity checks and downstream effects. Exported for testing.
export function handleConnectionFormFieldUpdate({
  action,
  connectionStringUrl,
  connectionOptions,
  initialErrors,
}: {
  action: ConnectionFormFieldActions;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
  initialErrors: ConnectionFormError[];
}): {
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
  errors: ConnectionFormError[];
} {
  const updatedConnectionStringUrl = connectionStringUrl.clone();
  const updatedSearchParams =
    updatedConnectionStringUrl.typedSearchParams<MongoClientOptions>();

  switch (action.type) {
    case 'add-new-host': {
      const { fieldIndexToAddAfter } = action;

      const newHost = getNextHost(
        updatedConnectionStringUrl.hosts,
        fieldIndexToAddAfter
      );
      updatedConnectionStringUrl.hosts.splice(
        fieldIndexToAddAfter + 1,
        0,
        newHost
      );
      if (updatedSearchParams.get('directConnection')) {
        updatedSearchParams.delete('directConnection');
      }

      return {
        connectionStringUrl: updatedConnectionStringUrl,
        connectionOptions: {
          ...connectionOptions,
          connectionString: updatedConnectionStringUrl.toString(),
        },
        errors: [],
      };
    }
    case 'remove-host': {
      const { fieldIndexToRemove } = action;

      updatedConnectionStringUrl.hosts.splice(fieldIndexToRemove, 1);

      if (
        updatedConnectionStringUrl.hosts.length === 1 &&
        !updatedConnectionStringUrl.hosts[0]
      ) {
        // If the user removes a host, leaving a single empty host, it will
        // create an invalid connection string. Here we default the value.
        updatedConnectionStringUrl.hosts[0] = `${defaultHostname}:${defaultPort}`;
      }

      return {
        connectionStringUrl: updatedConnectionStringUrl,
        connectionOptions: {
          ...connectionOptions,
          connectionString: updatedConnectionStringUrl.toString(),
        },
        errors: [],
      };
    }
    case 'update-tls-option': {
      return handleUpdateTlsOption({
        tlsOption: action.tlsOption,
        connectionStringUrl,
        connectionOptions,
      });
    }
    case 'update-host': {
      return handleUpdateHost({
        action,
        connectionStringUrl,
        connectionOptions,
      });
    }
    case 'update-direct-connection': {
      const { isDirectConnection } = action;
      if (isDirectConnection) {
        updatedSearchParams.set('directConnection', 'true');
      } else if (updatedSearchParams.get('directConnection')) {
        updatedSearchParams.delete('directConnection');
      }

      return {
        connectionStringUrl: updatedConnectionStringUrl,
        connectionOptions: {
          ...connectionOptions,
          connectionString: updatedConnectionStringUrl.toString(),
        },
        errors: [],
      };
    }
    case 'update-connection-schema': {
      const { isSrv } = action;

      try {
        const newConnectionStringUrl = tryUpdateConnectionStringSchema(
          connectionStringUrl,
          isSrv
        );

        return {
          connectionStringUrl: newConnectionStringUrl,
          connectionOptions: {
            ...connectionOptions,
            connectionString: newConnectionStringUrl.toString(),
          },
          errors: [],
        };
      } catch (err) {
        return {
          connectionStringUrl,
          connectionOptions: {
            ...connectionOptions,
            connectionString: connectionStringUrl.toString(),
          },
          errors: [
            {
              fieldName: 'isSrv',
              message: `Error updating connection schema: ${
                (err as Error).message
              }`,
            },
          ],
        };
      }
    }
    case 'update-ssh-options': {
      return handleUpdateSshOptions(action, {
        connectionOptions,
        connectionStringUrl,
        errors: initialErrors,
        warnings: [],
        connectionStringInvalidError: null,
      });
    }
    case 'update-search-param': {
      // User is trying to change the key of searchParam (w => journal)
      if (action.newKey) {
        const newValue =
          action.value ?? updatedSearchParams.get(action.currentKey);
        updatedSearchParams.delete(action.currentKey);
        updatedSearchParams.set(action.newKey, newValue);
      } else {
        updatedSearchParams.set(action.currentKey, action.value);
      }

      return {
        connectionStringUrl: updatedConnectionStringUrl,
        connectionOptions: {
          ...connectionOptions,
          connectionString: updatedConnectionStringUrl.toString(),
        },
        errors: initialErrors,
      };
    }
    case 'delete-search-param': {
      updatedSearchParams.delete(action.key);
      return {
        connectionStringUrl: updatedConnectionStringUrl,
        connectionOptions: {
          ...connectionOptions,
          connectionString: updatedConnectionStringUrl.toString(),
        },
        errors: initialErrors,
      };
    }
    case 'update-connection-path': {
      updatedConnectionStringUrl.pathname = action.value;
      return {
        connectionStringUrl: updatedConnectionStringUrl,
        connectionOptions: {
          ...connectionOptions,
          connectionString: updatedConnectionStringUrl.toString(),
        },
        errors: initialErrors,
      };
    }
  }
}

export function useConnectForm(initialConnectionInfo: ConnectionInfo): [
  ConnectFormState,
  {
    setConnectionStringError: (errorMessage: string | null) => void;
    setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
    updateConnectionFormField: UpdateConnectionFormField;
    setErrors: (errors: ConnectionFormError[]) => void;
  }
] {
  const [state, dispatch] = useReducer(
    connectFormReducer,
    initialConnectionInfo,
    buildStateFromConnectionInfo
  );

  useEffect(() => {
    // When the initial connection options change, like a different
    // connection is clicked in the compass-sidebar, we
    // refresh the current connection string being edited.
    // We do this here to retain the tabs/expanded accordion states.
    const {
      errors,
      warnings,
      connectionStringInvalidError,
      connectionStringUrl,
      connectionOptions,
    } = buildStateFromConnectionInfo(initialConnectionInfo);

    dispatch({
      type: 'set-connection-string-state',
      newState: {
        errors,
        warnings,
        connectionStringInvalidError,
        connectionStringUrl,
        connectionOptions,
      },
    });
  }, [initialConnectionInfo]);

  function setConnectionStringUrl(connectionStringUrl: ConnectionStringUrl) {
    dispatch({
      type: 'set-connection-string-url',
      connectionStringUrl,
    });
  }

  function updateConnectionFormField(action: ConnectionFormFieldActions) {
    const {
      connectionOptions,
      connectionStringUrl,
      errors: formFieldErrors,
    } = handleConnectionFormFieldUpdate({
      action,
      connectionOptions: state.connectionOptions,
      connectionStringUrl: state.connectionStringUrl,
      initialErrors: state.errors,
    });

    dispatch({
      type: 'set-connection-string-state',
      newState: {
        connectionStringInvalidError: null,
        errors: [...formFieldErrors],
        warnings: validateConnectionOptionsWarnings(connectionOptions),

        connectionStringUrl,
        connectionOptions,
      },
    });
  }

  return [
    state,
    {
      setConnectionStringError: (errorMessage: string | null) => {
        dispatch({
          type: 'set-connection-string-error',
          errorMessage,
        });
      },
      setConnectionStringUrl,
      updateConnectionFormField,
      setErrors: (errors: ConnectionFormError[]) => {
        dispatch({
          type: 'set-form-errors',
          errors,
        });
      },
    },
  ];
}
