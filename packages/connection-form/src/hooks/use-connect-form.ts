import { useReducer, type Dispatch, useCallback, useEffect } from 'react';
import type { ConnectionOptions } from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import type { MongoClientOptions, ProxyOptions } from 'mongodb';
import { cloneDeep, isEqual } from 'lodash';
import type ConnectionStringUrl from 'mongodb-connection-string-url';

import type {
  ConnectionFormError,
  ConnectionFormWarning,
} from '../utils/validation';
import { validateConnectionOptionsWarnings } from '../utils/validation';
import { getNextHost } from '../utils/get-next-host';
import {
  defaultConnectionString,
  defaultHostname,
  defaultPort,
} from '../constants/default-connection';
import { checkForInvalidCharacterInHost } from '../utils/check-for-invalid-character-in-host';
import { tryUpdateConnectionStringSchema } from '../utils/connection-string-schema';
import type { UpdateSshOptions } from '../utils/connection-ssh-handler';
import { handleUpdateSshOptions } from '../utils/connection-ssh-handler';
import type {
  UpdateTlsAction,
  UpdateTlsOptionAction,
} from '../utils/tls-handler';
import { handleUpdateTls, handleUpdateTlsOption } from '../utils/tls-handler';
import type {
  UpdateAuthMechanismAction,
  UpdatePasswordAction,
  UpdateUsernameAction,
} from '../utils/authentication-handler';
import {
  handleUpdateUsername,
  handleUpdatePassword,
  handleUpdateAuthMechanism,
} from '../utils/authentication-handler';
import type { AuthMechanismProperties } from '../utils/connection-string-helpers';
import {
  parseAuthMechanismProperties,
  tryToParseConnectionString,
} from '../utils/connection-string-helpers';
import {
  handleUpdateCsfleStoreCredentials,
  handleUpdateCsfleParam,
  handleUpdateCsfleKmsParam,
  handleUpdateCsfleKmsTlsParam,
  adjustCSFLEParams,
} from '../utils/csfle-handler';
import type {
  UpdateCsfleStoreCredentialsAction,
  UpdateCsfleAction,
  UpdateCsfleKmsAction,
  UpdateCsfleKmsTlsAction,
} from '../utils/csfle-handler';
import {
  handleUpdateOIDCParam,
  adjustOIDCConnectionOptionsBeforeConnect,
} from '../utils/oidc-handler';
import type { UpdateOIDCAction } from '../utils/oidc-handler';
import { setAppNameParamIfMissing } from '../utils/set-app-name-if-missing';
import { applyForceConnectionOptions } from '../utils/force-connection-options';
import { useConnectionFormPreference } from './use-connect-form-preferences';

export interface ConnectFormState {
  connectionOptions: ConnectionOptions;
  enableEditingConnectionString: boolean;
  errors: ConnectionFormError[];
  warnings: ConnectionFormWarning[];
  isDirty: boolean;
  allowEditingIfProtected: boolean;
}

type Action =
  | {
      type: 'set-connection-form-state';
      newState: ConnectFormState;
    }
  | {
      type: 'set-enable-editing-connection-string';
      enableEditing: boolean;
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
    case 'set-connection-form-state':
      return {
        ...state,
        ...action.newState,
      };
    case 'set-enable-editing-connection-string':
      return {
        ...state,
        enableEditingConnectionString: action.enableEditing,
      };
    case 'set-form-errors':
      return {
        ...state,
        errors: action.errors,
      };
  }
}

// Actions for specific form fields

interface UpdateConnectionStringAction {
  type: 'update-connection-string';
  newConnectionStringValue: string;
}

interface UpdateHostAction {
  type: 'update-host';
  fieldIndex: number;
  newHostValue: string;
}

type ConnectionFormFieldActions =
  | UpdateConnectionStringAction
  | {
      type: 'add-new-host';
      fieldIndexToAddAfter: number;
    }
  | {
      type: 'remove-host';
      fieldIndexToRemove: number;
    }
  | UpdateUsernameAction
  | UpdatePasswordAction
  | UpdateAuthMechanismAction
  | UpdateHostAction
  | {
      type: 'update-connection-scheme';
      isSrv: boolean;
    }
  | UpdateSshOptions
  | UpdateTlsAction
  | UpdateTlsOptionAction
  | {
      type: 'update-search-param';
      currentKey: keyof MongoClientOptions;
      newKey?: keyof MongoClientOptions;
      value?: string;
    }
  | {
      type: 'delete-search-param';
      key: keyof MongoClientOptions;
    }
  | {
      type: 'update-auth-mechanism-property';
      key: keyof AuthMechanismProperties;
      value?: string;
    }
  | {
      type: 'update-connection-path';
      value: string;
    }
  | {
      type: 'remove-ssh-options';
    }
  | {
      type: 'remove-proxy-options';
    }
  | UpdateCsfleStoreCredentialsAction
  | UpdateCsfleAction
  | UpdateCsfleKmsAction
  | UpdateCsfleKmsTlsAction
  | UpdateOIDCAction;

export type UpdateConnectionFormField = (
  action: ConnectionFormFieldActions
) => void;

function parseConnectionString(
  connectionString: string
): [ConnectionStringUrl | undefined, ConnectionFormError[]] {
  const [parsedConnectionString, parsingError] =
    tryToParseConnectionString(connectionString);

  return [
    parsedConnectionString,
    parsingError
      ? [
          {
            fieldName: 'connectionString',
            fieldTab: 'general',
            message: parsingError.message,
          },
        ]
      : [],
  ];
}

function buildStateFromConnectionInfo(
  initialConnectionInfo: ConnectionInfo
): ConnectFormState {
  const [, errors] = parseConnectionString(
    initialConnectionInfo.connectionOptions.connectionString
  );
  // Only enable connection string editing (and in particular, doing so in
  // protected connection strings mode) when it's the default connection
  // string and the connection has not been connected to (saved recent/favorite).
  const isNewDefaultConnection =
    initialConnectionInfo.connectionOptions.connectionString ===
      defaultConnectionString && !initialConnectionInfo.lastUsed;
  return {
    errors: errors,
    enableEditingConnectionString: isNewDefaultConnection,
    allowEditingIfProtected: isNewDefaultConnection,
    warnings: errors?.length
      ? []
      : validateConnectionOptionsWarnings(
          initialConnectionInfo.connectionOptions
        ),
    connectionOptions: adjustCSFLEParams(
      cloneDeep(initialConnectionInfo.connectionOptions)
    ),
    isDirty: false,
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
  connectionOptions: ConnectionOptions;
  errors: ConnectionFormError[];
} {
  const { newHostValue, fieldIndex } = action;
  try {
    checkForInvalidCharacterInHost(newHostValue, connectionStringUrl.isSRV);

    const updatedConnectionString = connectionStringUrl.clone();
    updatedConnectionString.hosts[fieldIndex] = newHostValue || '';

    // Build a new connection string url to ensure the
    // validity of the update.
    const newConnectionStringUrl = updatedConnectionString.clone();

    return {
      connectionOptions: {
        ...cloneDeep(connectionOptions),
        connectionString: newConnectionStringUrl.toString(),
      },
      errors: [],
    };
  } catch (err) {
    // The host value is invalid, so we show the error and allow
    // the user to update it until we can update the
    // connection string url.
    return {
      connectionOptions: {
        ...cloneDeep(connectionOptions),
        connectionString: connectionStringUrl.toString(),
      },
      errors: [
        {
          fieldName: 'hosts',
          fieldTab: 'general',
          fieldIndex,
          message: (err as Error).message,
        },
      ],
    };
  }
}

// This function handles field updates from the connection form.
// It performs validity checks and downstream effects. Exported for testing.
export function handleConnectionFormFieldUpdate(
  action: ConnectionFormFieldActions,
  currentConnectionOptions: ConnectionOptions
): {
  connectionOptions: ConnectionOptions;
  errors?: ConnectionFormError[];
} {
  if (action.type === 'update-connection-string') {
    const [newParsedConnectionStringUrl, errors] = parseConnectionString(
      action.newConnectionStringValue
    );

    return {
      connectionOptions: {
        ...currentConnectionOptions,
        connectionString:
          newParsedConnectionStringUrl?.toString() ||
          action.newConnectionStringValue,
      },
      errors,
    };
  }

  const [parsedConnectionStringUrl, errors] = parseConnectionString(
    currentConnectionOptions.connectionString
  );

  if (!parsedConnectionStringUrl) {
    return {
      connectionOptions: currentConnectionOptions,
      errors: errors,
    };
  }

  const updatedSearchParams =
    parsedConnectionStringUrl.typedSearchParams<MongoClientOptions>();

  switch (action.type) {
    case 'add-new-host': {
      const { fieldIndexToAddAfter } = action;

      const newHost = getNextHost(
        parsedConnectionStringUrl.hosts,
        fieldIndexToAddAfter
      );
      parsedConnectionStringUrl.hosts.splice(
        fieldIndexToAddAfter + 1,
        0,
        newHost
      );
      if (updatedSearchParams.get('directConnection')) {
        updatedSearchParams.delete('directConnection');
      }

      return {
        connectionOptions: {
          ...currentConnectionOptions,
          connectionString: parsedConnectionStringUrl.toString(),
        },
      };
    }
    case 'remove-host': {
      const { fieldIndexToRemove } = action;

      parsedConnectionStringUrl.hosts.splice(fieldIndexToRemove, 1);

      if (
        parsedConnectionStringUrl.hosts.length === 1 &&
        !parsedConnectionStringUrl.hosts[0]
      ) {
        // If the user removes a host, leaving a single empty host, it will
        // create an invalid connection string. Here we default the value.
        parsedConnectionStringUrl.hosts[0] = `${defaultHostname}:${defaultPort}`;
      }

      return {
        connectionOptions: {
          ...currentConnectionOptions,
          connectionString: parsedConnectionStringUrl.toString(),
        },
      };
    }
    case 'update-tls': {
      return handleUpdateTls({
        action,
        connectionStringUrl: parsedConnectionStringUrl,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-tls-option': {
      return handleUpdateTlsOption({
        action,
        connectionStringUrl: parsedConnectionStringUrl,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-auth-mechanism': {
      return handleUpdateAuthMechanism({
        action,
        connectionStringUrl: parsedConnectionStringUrl,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-username': {
      return handleUpdateUsername({
        action,
        connectionStringUrl: parsedConnectionStringUrl,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-password': {
      return handleUpdatePassword({
        action,
        connectionStringUrl: parsedConnectionStringUrl,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-host': {
      return handleUpdateHost({
        action,
        connectionStringUrl: parsedConnectionStringUrl,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-connection-scheme': {
      const { isSrv } = action;

      try {
        const newConnectionStringUrl = tryUpdateConnectionStringSchema(
          parsedConnectionStringUrl,
          isSrv
        );

        return {
          connectionOptions: {
            ...currentConnectionOptions,
            connectionString: newConnectionStringUrl.toString(),
          },
          errors: [],
        };
      } catch (err) {
        return {
          connectionOptions: {
            ...currentConnectionOptions,
          },
          errors: [
            {
              fieldName: 'isSrv',
              fieldTab: 'general',
              message: `Error updating connection schema: ${
                (err as Error).message
              }`,
            },
          ],
        };
      }
    }
    case 'update-ssh-options': {
      return handleUpdateSshOptions({
        action,
        connectionOptions: currentConnectionOptions,
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
        connectionOptions: {
          ...currentConnectionOptions,
          connectionString: parsedConnectionStringUrl.toString(),
        },
      };
    }
    case 'update-auth-mechanism-property': {
      const authMechanismProperties = parseAuthMechanismProperties(
        parsedConnectionStringUrl
      );

      if (action.value) {
        authMechanismProperties.set(action.key, action.value);
      } else {
        authMechanismProperties.delete(action.key);
      }

      const authMechanismPropertiesString = authMechanismProperties.toString();
      if (authMechanismPropertiesString) {
        updatedSearchParams.set(
          'authMechanismProperties',
          authMechanismPropertiesString
        );
      } else {
        updatedSearchParams.delete('authMechanismProperties');
      }

      return {
        connectionOptions: {
          ...currentConnectionOptions,
          connectionString: parsedConnectionStringUrl.toString(),
        },
      };
    }
    case 'delete-search-param': {
      updatedSearchParams.delete(action.key);
      return {
        connectionOptions: {
          ...currentConnectionOptions,
          connectionString: parsedConnectionStringUrl.toString(),
        },
      };
    }
    case 'update-connection-path': {
      parsedConnectionStringUrl.pathname = action.value;
      return {
        connectionOptions: {
          ...currentConnectionOptions,
          connectionString: parsedConnectionStringUrl.toString(),
        },
      };
    }
    case 'remove-proxy-options': {
      const proxyOptions: (keyof ProxyOptions)[] = [
        'proxyHost',
        'proxyPort',
        'proxyPassword',
        'proxyUsername',
      ];
      proxyOptions.forEach((key) => updatedSearchParams.delete(key));
      return {
        connectionOptions: {
          ...currentConnectionOptions,
          connectionString: parsedConnectionStringUrl.toString(),
        },
      };
    }
    case 'remove-ssh-options': {
      return {
        connectionOptions: {
          ...currentConnectionOptions,
          sshTunnel: undefined,
        },
      };
    }
    case 'update-csfle-store-credentials': {
      return handleUpdateCsfleStoreCredentials({
        action,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-csfle-param': {
      return handleUpdateCsfleParam({
        action,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-csfle-kms-param': {
      return handleUpdateCsfleKmsParam({
        action,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-csfle-kms-tls-param': {
      return handleUpdateCsfleKmsTlsParam({
        action,
        connectionOptions: currentConnectionOptions,
      });
    }
    case 'update-oidc-param': {
      return handleUpdateOIDCParam({
        action,
        connectionOptions: currentConnectionOptions,
      });
    }
  }
}

export function useConnectForm(
  initialConnectionInfo: ConnectionInfo,
  connectionErrorMessage?: string | null
): [
  ConnectFormState,
  {
    updateConnectionFormField: UpdateConnectionFormField;
    setErrors: (errors: ConnectionFormError[]) => void;
    setEnableEditingConnectionString: (enableEditing: boolean) => void;
  }
] {
  const derivedFormState = buildStateFromConnectionInfo(initialConnectionInfo);
  const initialFormState: ConnectFormState = {
    ...derivedFormState,
    enableEditingConnectionString:
      !useConnectionFormPreference(
        'protectConnectionStringsForNewConnections'
      ) && derivedFormState.enableEditingConnectionString,
  };

  const [state, dispatch] = useReducer(connectFormReducer, initialFormState);

  const setErrors = useCallback((errors: ConnectionFormError[]) => {
    dispatch({
      type: 'set-form-errors',
      errors,
    });
  }, []);

  const setEnableEditingConnectionString = useCallback(
    (enableEditing: boolean) => {
      dispatch({
        type: 'set-enable-editing-connection-string',
        enableEditing,
      });
    },
    []
  );

  const updateConnectionFormField = useCallback(
    (action: ConnectionFormFieldActions) => {
      const updatedState = handleConnectionFormFieldUpdate(
        action,
        state.connectionOptions
      );
      dispatch({
        type: 'set-connection-form-state',
        newState: {
          ...state,
          errors: [], // on each update the errors should reset
          ...updatedState,
          warnings: updatedState.errors?.length
            ? []
            : validateConnectionOptionsWarnings(updatedState.connectionOptions),
          isDirty: !isEqual(
            updatedState.connectionOptions,
            state.connectionOptions
          ),
        },
      });
    },
    [state]
  );

  setInitialState({
    connectionErrorMessage,
    initialConnectionInfo,
    setErrors,
    dispatch,
  });

  return [
    state,
    {
      updateConnectionFormField,
      setEnableEditingConnectionString,
      setErrors,
    },
  ];
}

function setInitialState({
  connectionErrorMessage,
  initialConnectionInfo,
  setErrors,
  dispatch,
}: {
  connectionErrorMessage: string | null | undefined;
  initialConnectionInfo: ConnectionInfo;
  setErrors: (errors: ConnectionFormError[]) => void;
  dispatch: Dispatch<Action>;
}) {
  const protectConnectionStringsForNewConnections = useConnectionFormPreference(
    'protectConnectionStringsForNewConnections'
  );
  useEffect(() => {
    // When the initial connection options change, like a different
    // connection is clicked in the compass-sidebar, we
    // refresh the current connection string being edited.
    // We do this here to retain the tabs/expanded accordion states.
    const {
      errors,
      warnings,
      connectionOptions,
      allowEditingIfProtected,
      enableEditingConnectionString,
    } = buildStateFromConnectionInfo(initialConnectionInfo);

    dispatch({
      type: 'set-connection-form-state',
      newState: {
        errors,
        enableEditingConnectionString:
          !protectConnectionStringsForNewConnections &&
          enableEditingConnectionString,
        warnings,
        connectionOptions,
        isDirty: false,
        allowEditingIfProtected,
      },
    });
  }, [initialConnectionInfo, protectConnectionStringsForNewConnections]);

  useEffect(() => {
    if (connectionErrorMessage) {
      setErrors([{ message: connectionErrorMessage }]);
    }
  }, [setErrors, connectionErrorMessage]);
}

export function adjustConnectionOptionsBeforeConnect({
  connectionOptions,
  defaultAppName,
  notifyDeviceFlow,
  preferences,
}: {
  connectionOptions: Readonly<ConnectionOptions>;
  defaultAppName?: string;
  notifyDeviceFlow?: (deviceFlowInformation: {
    verificationUrl: string;
    userCode: string;
  }) => void;
  preferences: {
    browserCommandForOIDCAuth?: string;
    forceConnectionOptions: [string, string][];
  };
}): ConnectionOptions {
  const transformers: ((
    connectionOptions: Readonly<ConnectionOptions>
  ) => ConnectionOptions)[] = [
    adjustCSFLEParams,
    setAppNameParamIfMissing(defaultAppName),
    adjustOIDCConnectionOptionsBeforeConnect({
      browserCommandForOIDCAuth: preferences.browserCommandForOIDCAuth,
      notifyDeviceFlow,
    }),
    applyForceConnectionOptions(preferences.forceConnectionOptions),
  ];
  for (const transformer of transformers) {
    connectionOptions = transformer(connectionOptions);
  }
  return connectionOptions;
}
