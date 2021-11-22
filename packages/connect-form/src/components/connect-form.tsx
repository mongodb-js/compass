import { css } from '@emotion/css';
import React, { useEffect, useReducer } from 'react';
import { ConnectionOptions } from 'mongodb-data-service';
import { Card, Description, H3, spacing } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import ConnectionStringInput from './connection-string-input';
import AdvancedConnectionOptions from './advanced-connection-options';
import ConnectFormActions from './connect-form-actions';

const formContainerStyles = css({
  margin: 0,
  padding: spacing[4],
  height: 'fit-content',
  flexGrow: 1,
  minWidth: 400,
  maxWidth: 760,
  position: 'relative',
  display: 'inline-block',
});

const formCardStyles = css({
  margin: 0,
  padding: spacing[2],
  height: 'fit-content',
  width: '100%',
  position: 'relative',
});

const descriptionStyles = css({
  marginTop: spacing[2],
});

const formContentContainerStyles = css({
  padding: spacing[4],
});

interface State {
  connectionStringInvalidError: string | null;
  connectionStringUrl: ConnectionStringUrl;
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
      connectionStringInvalidError: string | null;
      connectionStringUrl: ConnectionStringUrl;
    };

function connectFormReducer(state: State, action: Action): State {
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
      };
    case 'set-connection-string-state':
      return {
        ...state,
        connectionStringUrl: action.connectionStringUrl,
        connectionStringInvalidError: action.connectionStringInvalidError,
      };
  }
}

function parseConnectionUrlFromOptions(
  initialConnectionOptions: ConnectionOptions
) {
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
  };
}

function useConnectForm(initialConnectionOptions: ConnectionOptions): [
  State,
  {
    setConnectionStringError: (errorMessage: string | null) => void;
    setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
    setConnectionItem: (name: string, value: string) => void;
    setConnectionStringQueryItem: (name: string, value: string) => void;
  }
] {
  // TODO: Try to validate connection string - if invalid disable options?
  const [state, dispatch] = useReducer(
    connectFormReducer,
    parseConnectionUrlFromOptions(initialConnectionOptions)
  );

  useEffect(() => {
    // When the initial connection options change, like a different
    // connection is clicked in the compass-sidebar, we
    // refresh the current connection string being edited.
    // We do this here to retain the tabs/expanded accordion states.
    const { connectionStringInvalidError, connectionStringUrl } =
      parseConnectionUrlFromOptions(initialConnectionOptions);

    dispatch({
      type: 'set-connection-string-state',
      connectionStringInvalidError,
      connectionStringUrl,
    });
  }, [initialConnectionOptions]);

  // const {} = useMemo // initialConnectionOptions

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
        dispatch({
          type: 'set-connection-string-url',
          connectionStringUrl,
        });
      },
      setConnectionItem: (name: string, value: string) => {
        //
        // TODO: Try to set the item on the current connection string url.
        // If it works cool.
        // If not error.
      },
      setConnectionStringQueryItem: (name: string, value: string) => {
        //
      },
    },
  ];
}

function ConnectForm({
  initialConnectionOptions,
  onConnectClicked,
}: {
  initialConnectionOptions: ConnectionOptions;
  onConnectClicked: (connectionOptions: ConnectionOptions) => void;
}): React.ReactElement {
  const [
    {
      // connectionStringInvalidError,
      connectionStringUrl,
      connectionStringInvalidError,
    },
    {
      setConnectionStringUrl,
      setConnectionStringError,
      // setConnectionItem,
      // setConnectionStringQueryItem
    },
  ] = useConnectForm(initialConnectionOptions);

  // TODO: The initial connection string can be invalid.
  //

  // TODO: Which as value? Plain string or typed?
  // Plain for the connection string input to show the error.

  const editingConnectionStringUrl = connectionStringUrl;

  return (
    <div className={formContainerStyles}>
      <Card className={formCardStyles}>
        <div className={formContentContainerStyles}>
          <H3>New Connection</H3>
          <Description className={descriptionStyles}>
            Connect to a MongoDB deployment
          </Description>
          <ConnectionStringInput
            connectionString={editingConnectionStringUrl.toString()}
            setConnectionStringUrl={setConnectionStringUrl}
            setConnectionStringError={setConnectionStringError}
          />
          <AdvancedConnectionOptions
            connectionStringUrl={editingConnectionStringUrl}
            setConnectionStringUrl={setConnectionStringUrl}
          />
        </div>
        <ConnectFormActions
          onConnectClicked={() =>
            onConnectClicked({
              ...initialConnectionOptions,
              connectionString: editingConnectionStringUrl.toString(),
            })
          }
        />
      </Card>
    </div>
  );
}

export default ConnectForm;
