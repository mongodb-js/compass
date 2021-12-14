import { useEffect, useReducer } from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';

import { defaultConnectionString } from '../constants/default-connection';
import {
  ConnectionFormWarning,
  getConnectFormWarnings,
} from '../utils/connect-form-warnings';
import {
  ConnectionFormError,
  InvalidFormFieldsState,
  getConnectFormErrors,
} from '../utils/connect-form-errors';
import { getNextHost } from '../utils/get-next-host';
import { defaultHostname, defaultPort } from '../constants/default-connection';
import { MARKABLE_FORM_FIELD_NAMES } from '../constants/markable-form-fields';
import { checkForInvalidCharacterInHost } from '../utils/check-for-invalid-character-in-host';
import { tryUpdateConnectionStringSchema } from '../utils/connection-string-schema';

export interface ConnectFormState {
  connectionStringInvalidError: string | null;
  connectionOptions: ConnectionOptions;
  connectionStringUrl: ConnectionStringUrl;

  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];

  invalidFields: InvalidFormFieldsState | null;
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
      type: 'hide-error';
      errorIndex: number;
    }
  | {
      type: 'hide-warning';
      warningIndex: number;
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
        invalidFields: null,
      };
    case 'set-connection-string-state':
      return {
        ...state,
        ...action.newState,
      };
    case 'hide-error':
      return {
        ...state,
        errors: [...state.errors].splice(action.errorIndex, 1),
      };
    case 'hide-warning':
      return {
        ...state,
        warnings: [...state.warnings].splice(action.warningIndex, 1),
      };
  }
}

interface UpdateHostAction {
  type: 'update-host';
  hostIndex: number;
  newHostValue: string;
}

type ConnectionFormFieldActions =
  | {
      type: 'add-new-host';
      hostIndexToAddAfter: number;
    }
  | {
      type: 'remove-host';
      hostIndexToRemove: number;
    }
  | UpdateHostAction
  | {
      type: 'update-direct-connection';
      isDirectConnection: boolean;
    }
  | {
      type: 'update-connection-schema';
      isSrv: boolean;
    };

export type UpdateConnectionFormField = (
  action: ConnectionFormFieldActions
) => void;

function buildStateFromConnectionOptions(
  initialConnectionOptions: ConnectionOptions
): ConnectFormState {
  let connectionStringInvalidError = null;
  let connectionStringUrl = new ConnectionStringUrl(defaultConnectionString);
  try {
    connectionStringUrl = new ConnectionStringUrl(
      initialConnectionOptions.connectionString
    );
  } catch (error) {
    connectionStringInvalidError = (error as Error).message;
  }

  const connectionOptions = {
    ...initialConnectionOptions,
  };

  return {
    errors: getConnectFormErrors(connectionOptions),
    warnings: getConnectFormWarnings(connectionOptions),

    connectionStringInvalidError,
    connectionStringUrl,
    connectionOptions,
    invalidFields: null,
  };
}

function handleUpdateHost({
  action,
  connectionStringUrl,
  connectionOptions,
  invalidFields,
}: {
  action: UpdateHostAction;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
  invalidFields: InvalidFormFieldsState | null;
}): {
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
  invalidFields: InvalidFormFieldsState | null;
  errors: ConnectionFormError[];
} {
  const { newHostValue, hostIndex } = action;
  try {
    checkForInvalidCharacterInHost(newHostValue, connectionStringUrl.isSRV);

    const updatedConnectionString = connectionStringUrl.clone();
    updatedConnectionString.hosts[hostIndex] = newHostValue || '';

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
      invalidFields: null,
      errors: [],
    };
  } catch (err) {
    // The host value is invalid, so we show the error and allow
    // the user to update it until we can update the
    // connection string url.
    const updatedHosts =
      invalidFields !== null && invalidFields.hosts !== null
        ? [...invalidFields.hosts]
        : [...connectionStringUrl.hosts];
    updatedHosts[hostIndex] = newHostValue;

    return {
      connectionStringUrl,
      connectionOptions: {
        ...connectionOptions,
        connectionString: connectionStringUrl.toString(),
      },
      invalidFields:
        invalidFields !== null
          ? {
              ...invalidFields,
              hosts: updatedHosts,
            }
          : {
              hosts: updatedHosts,
            },

      errors: [
        {
          fieldName: MARKABLE_FORM_FIELD_NAMES.HOSTS,
          message: (err as Error).message,
        },
      ],
    };
  }
}

function handleConnectionFormFieldUpdate({
  action,
  connectionStringUrl,
  connectionOptions,
  invalidFields,
}: {
  action: ConnectionFormFieldActions;
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
  invalidFields: InvalidFormFieldsState | null;
}): {
  connectionStringUrl: ConnectionStringUrl;
  connectionOptions: ConnectionOptions;
  invalidFields: InvalidFormFieldsState | null;
  errors: ConnectionFormError[];
} {
  const updatedConnectionStringUrl = connectionStringUrl.clone();

  switch (action.type) {
    case 'add-new-host': {
      const { hostIndexToAddAfter } = action;

      const newHost = getNextHost(
        updatedConnectionStringUrl.hosts,
        hostIndexToAddAfter
      );
      updatedConnectionStringUrl.hosts.splice(
        hostIndexToAddAfter + 1,
        0,
        newHost
      );
      if (updatedConnectionStringUrl.searchParams.get('directConnection')) {
        updatedConnectionStringUrl.searchParams.delete('directConnection');
      }

      return {
        connectionStringUrl: updatedConnectionStringUrl,
        connectionOptions: {
          ...connectionOptions,
          connectionString: updatedConnectionStringUrl.toString(),
        },
        invalidFields: null,
        errors: [],
      };
    }
    case 'remove-host': {
      const { hostIndexToRemove } = action;

      updatedConnectionStringUrl.hosts.splice(hostIndexToRemove, 1);

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
        invalidFields: null,
        errors: [],
      };
    }
    case 'update-host': {
      return handleUpdateHost({
        action,
        connectionStringUrl,
        connectionOptions,
        invalidFields,
      });
    }
    case 'update-direct-connection': {
      const { isDirectConnection } = action;
      if (isDirectConnection) {
        updatedConnectionStringUrl.searchParams.set('directConnection', 'true');
      } else if (
        updatedConnectionStringUrl.searchParams.get('directConnection')
      ) {
        updatedConnectionStringUrl.searchParams.delete('directConnection');
      }

      return {
        connectionStringUrl: updatedConnectionStringUrl,
        connectionOptions: {
          ...connectionOptions,
          connectionString: updatedConnectionStringUrl.toString(),
        },
        invalidFields: null,
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
            connectionString: updatedConnectionStringUrl.toString(),
          },
          invalidFields: null,
          errors: [],
        };
      } catch (err) {
        return {
          connectionStringUrl,
          connectionOptions: {
            ...connectionOptions,
            connectionString: connectionStringUrl.toString(),
          },
          invalidFields,
          errors: [
            {
              fieldName: MARKABLE_FORM_FIELD_NAMES.IS_SRV,
              message: `Error updating connection schema: ${
                (err as Error).message
              }`,
            },
          ],
        };
      }
    }
  }
}

export function useConnectForm(initialConnectionOptions: ConnectionOptions): [
  ConnectFormState,
  {
    setConnectionStringError: (errorMessage: string | null) => void;
    setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
    updateConnectionFormField: UpdateConnectionFormField;
    hideError: (index: number) => void;
    hideWarning: (index: number) => void;
  }
] {
  const [state, dispatch] = useReducer(
    connectFormReducer,
    buildStateFromConnectionOptions(initialConnectionOptions)
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
      invalidFields,
    } = buildStateFromConnectionOptions(initialConnectionOptions);

    dispatch({
      type: 'set-connection-string-state',
      newState: {
        errors,
        warnings,
        connectionStringInvalidError,
        connectionStringUrl,
        connectionOptions,
        invalidFields,
      },
    });
  }, [initialConnectionOptions]);

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
      invalidFields,
    } = handleConnectionFormFieldUpdate({
      action,
      connectionOptions: state.connectionOptions,
      connectionStringUrl: state.connectionStringUrl,
      invalidFields: state.invalidFields,
    });

    dispatch({
      type: 'set-connection-string-state',
      newState: {
        connectionStringInvalidError: null,
        errors: [
          ...formFieldErrors,
          ...getConnectFormErrors(connectionOptions),
        ],
        warnings: getConnectFormWarnings(connectionOptions),

        connectionStringUrl,
        connectionOptions,
        invalidFields: invalidFields,
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
      hideError: (errorIndex: number) => {
        dispatch({
          type: 'hide-error',
          errorIndex,
        });
      },
      hideWarning: (warningIndex: number) => {
        dispatch({
          type: 'hide-warning',
          warningIndex,
        });
      },
      updateConnectionFormField,
    },
  ];
}
