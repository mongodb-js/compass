import { useEffect, useReducer } from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';

import { defaultConnectionString } from '../constants/default-connection';
export interface ConnectFormFields {
  hosts: {
    value: string[];
    error: null | string;
  };
  isSRV: {
    conversionError: null | string;
  };
}
export interface ConnectFormState {
  connectionStringInvalidError: string | null;
  connectionStringUrl: ConnectionStringUrl;

  fields: ConnectFormFields;
}

export type SetConnectionFieldAction =
  | {
      type: 'set-connection-string-field';
      fieldName: 'hosts';
      value: ConnectFormFields['hosts'];
    }
  | {
      type: 'set-connection-string-field';
      fieldName: 'isSRV';
      value: ConnectFormFields['isSRV'];
    };

export type SetConnectionField = (action: SetConnectionFieldAction) => void;

type Action =
  | SetConnectionFieldAction
  | {
      type: 'set-connection-string-error';
      errorMessage: string | null;
    }
  | {
      type: 'set-connection-string-url';
      connectionStringUrl: ConnectionStringUrl;
      fields: ConnectFormFields;
    }
  | {
      type: 'set-connection-string-state';
      connectionStringInvalidError: string | null;
      connectionStringUrl: ConnectionStringUrl;
      fields: ConnectFormFields;
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
        fields: action.fields,
      };
    case 'set-connection-string-state':
      return {
        ...state,
        fields: action.fields,
        connectionStringUrl: action.connectionStringUrl,
        connectionStringInvalidError: action.connectionStringInvalidError,
      };
    case 'set-connection-string-field':
      return {
        ...state,
        fields: {
          ...state.fields,
          [action.fieldName]: action.value,
        },
      };
  }
}

export function parseConnectFormFieldStateFromConnectionUrl(
  connectionStringUrl: ConnectionStringUrl
): ConnectFormFields {
  return {
    hosts: {
      value: connectionStringUrl.hosts,
      error: null,
    },
    isSRV: {
      conversionError: null,
    },
  };
}

function parseConnectFormStateFromOptions(
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

  return {
    connectionStringInvalidError,
    connectionStringUrl,
    fields: parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl),
  };
}

export function useConnectForm(initialConnectionOptions: ConnectionOptions): [
  ConnectFormState,
  {
    setConnectionStringError: (errorMessage: string | null) => void;
    setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
    setConnectionField: SetConnectionField;
  }
] {
  const [state, dispatch] = useReducer(
    connectFormReducer,
    parseConnectFormStateFromOptions(initialConnectionOptions)
  );

  useEffect(() => {
    // When the initial connection options change, like a different
    // connection is clicked in the compass-sidebar, we
    // refresh the current connection string being edited.
    // We do this here to retain the tabs/expanded accordion states.
    const { connectionStringInvalidError, connectionStringUrl, fields } =
      parseConnectFormStateFromOptions(initialConnectionOptions);

    dispatch({
      type: 'set-connection-string-state',
      connectionStringInvalidError,
      connectionStringUrl,
      fields,
    });
  }, [initialConnectionOptions]);

  return [
    state,
    {
      setConnectionStringError: (errorMessage: string | null) => {
        dispatch({
          type: 'set-connection-string-error',
          errorMessage,
        });
      },
      setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => {
        const fields =
          parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);

        dispatch({
          type: 'set-connection-string-url',
          connectionStringUrl,
          fields,
        });
      },
      setConnectionField: (action: SetConnectionFieldAction) => {
        dispatch(action);
      },
    },
  ];
}
