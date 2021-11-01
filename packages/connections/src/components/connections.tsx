import { css } from '@emotion/css';
import React, { useReducer } from 'react';
import { compassUIColors, spacing } from '@mongodb-js/compass-components';
import ConnectForm from '@mongodb-js/connect-form';
import { ConnectionInfo } from 'mongodb-data-service';
import { v4 as uuidv4 } from 'uuid';

import ResizableSiderbar from './resizeable-sidebar';
import FormHelp from './form-help/form-help';

const connectStyles = css({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'row',
  background: compassUIColors.gray8,
});

const formContainerStyles = css({
  position: 'relative',
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'row',
  padding: 0,
  paddingBottom: spacing[4],
  overflow: 'auto',
});

function getDefaultConnectionInfo() {
  return {
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };
}

const mockRecents: ConnectionInfo[] = [];
for (let i = 0; i < 15; i++) {
  mockRecents.push({
    id: `mock-connection-${i}`,
    connectionOptions: {
      connectionString: `mongodb://localhost:2${
        5000 + Math.floor(Math.random() * 5000)
      }`,
    },
    lastUsed: new Date(Date.now() - (Date.now() / 2) * Math.random()),
  });
}

const mockConnections = [
  {
    id: 'mock-connection-dev',
    connectionOptions: {
      connectionString: '',
    },
    favorite: {
      name: 'Development cluster',
      color: '#deb342',
    },
    lastUsed: new Date(),
  },
  {
    id: 'mock-connection-atlas',
    connectionOptions: {
      connectionString:
        'mongodb+srv://testUserForTesting:notMyRealPassword@test.mongodb.net/test?authSource=admin&replicaSet=art-dev-shard-0&readPreference=primary&ssl=true',
    },
    favorite: {
      name: 'Atlas test',
      color: '#d4366e',
    },
    lastUsed: new Date(),
  },
  {
    id: 'mock-connection-empty-connection',
    connectionOptions: {
      connectionString: '',
    },
    favorite: {
      name: 'super long favorite name - super long favorite name - super long favorite name - super long favorite name',
      color: '#5fc86e',
    },
    lastUsed: new Date(),
  },
  {
    id: 'mock-connection-invalid string',
    connectionOptions: {
      connectionString: 'invalid connection string',
    },
    lastUsed: new Date(),
  },
  ...mockRecents,
];
const connections = mockConnections;

type State = {
  activeConnectionId?: string;
  activeConnectionInfo: ConnectionInfo;
};

type Action =
  | {
      type: 'new-connection';
      newConnectionId: string;
    }
  | {
      type: 'set-active-connection';
      connectionId: string;
      connectionInfo: ConnectionInfo;
    };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'set-active-connection':
      return {
        ...state,
        activeConnectionId: action.connectionId,
        activeConnectionInfo: action.connectionInfo,
      };
    case 'new-connection':
      return {
        ...state,
        activeConnectionId: action.newConnectionId,
        activeConnectionInfo: {
          ...getDefaultConnectionInfo(),
          id: action.newConnectionId,
        },
      };
    default:
      return state;
  }
}

function Connections(): React.ReactElement {
  const [{ activeConnectionId, activeConnectionInfo }, dispatch] = useReducer(
    reducer,
    {
      activeConnectionId: undefined,
      activeConnectionInfo: {
        ...getDefaultConnectionInfo(),
      },
    }
  );

  const updateActiveConnection = (newConnectionId?: string | undefined) => {
    if (newConnectionId) {
      const connection = connections.find(
        (connection) => connection.id === newConnectionId
      );
      if (connection) {
        dispatch({
          type: 'set-active-connection',
          connectionId: newConnectionId,
          connectionInfo: connection,
        });
        return;
      }
    }

    dispatch({
      type: 'new-connection',
      newConnectionId: uuidv4(),
    });
  };

  return (
    <div className={connectStyles}>
      <ResizableSiderbar
        activeConnectionId={activeConnectionId}
        connections={connections}
        setActiveConnectionId={updateActiveConnection}
      />
      <div className={formContainerStyles}>
        <ConnectForm
          onConnectClicked={(connectionInfo) =>
            alert(
              `connect to ${connectionInfo.connectionOptions.connectionString}`
            )
          }
          initialConnectionInfo={activeConnectionInfo}
          key={activeConnectionId}
        />
        <FormHelp />
      </div>
    </div>
  );
}

export default Connections;
