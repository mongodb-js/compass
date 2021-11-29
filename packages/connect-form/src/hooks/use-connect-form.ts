import { useEffect, useReducer } from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';

export interface ConnectFormFields {
  hosts: {
    value: string[];
    warning: null | string;
    error: null | string;
  };
  // isSRV: {
  //   value: boolean;
  //   // warning: null | string,
  //   // error: null | string
  // };
  // directConnection: {
  //   value: boolean;
  //   // warning: null | string,
  //   // error: null | string
  // };
}
export interface ConnectFormState {
  connectionStringInvalidError: string | null;
  connectionStringUrl: ConnectionStringUrl;

  fields: ConnectFormFields;
}

export type SetConnectionField = (
  fieldName: 'hosts',
  value: ConnectFormFields['hosts']
) => void;

type Action =
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
    }
  | {
      type: 'set-connection-string-field';
      value: ConnectFormFields['hosts'];
      fieldName: keyof ConnectFormFields;
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
      warning: null,
      error: null,
    },
    // isSRV: {
    //   value: connectionStringUrl.isSRV,
    //   // warning: null,
    //   // error: null
    // },
    // directConnection: {
    //   value:
    //     connectionStringUrl.searchParams.get('directConnection') === 'true',
    //   // warning: null,
    //   // error: null
    // },
  };
}

function parseConnectFormStateFromOptions(
  initialConnectionOptions: ConnectionOptions
): ConnectFormState {
  let connectionStringInvalidError = null;
  // TODO: Have a default connection string variable somewhere.
  let connectionStringUrl = new ConnectionStringUrl(
    'mongodb://localhost:27017'
  );
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
  // TODO: Try to validate connection string - if invalid disable options?
  const [state, dispatch] = useReducer(
    connectFormReducer,
    parseConnectFormStateFromOptions(initialConnectionOptions)
  );
  // console.log('the state', state);

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
        console.log('setConnectionStringUrl', connectionStringUrl);
        console.log('setConnectionStringUrl', connectionStringUrl.toString());
        const fields =
          parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);

        dispatch({
          type: 'set-connection-string-url',
          connectionStringUrl,
          fields,
        });
      },
      setConnectionField: (
        fieldName: keyof ConnectFormFields,
        value: ConnectFormFields['hosts']
      ) => {
        dispatch({
          type: 'set-connection-string-field',
          fieldName,
          value,
        });
      },
    },
  ];
}
