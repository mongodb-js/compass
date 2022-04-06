import type {
  ConnectionInfo,
  ConnectionOptions,
  DataService,
  ConnectionStorage,
} from 'mongodb-data-service';
import { getConnectionTitle } from 'mongodb-data-service';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import debugModule from 'debug';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import type { ConnectionAttempt } from '../modules/connection-attempt';
import { createConnectionAttempt } from '../modules/connection-attempt';
import {
  trackConnectionAttemptEvent,
  trackNewConnectionEvent,
  trackConnectionFailedEvent,
} from '../modules/telemetry';
import ConnectionString from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';
import { adjustConnectionOptionsBeforeConnect } from '@mongodb-js/connection-form';

import { ToastVariant, useToast } from '@mongodb-js/compass-components';
const debug = debugModule('mongodb-compass:connections:connections-store');

export function createNewConnectionInfo(): ConnectionInfo {
  return {
    id: uuidv4(),
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };
}

function ensureWellFormedConnectionString(connectionString: string) {
  new ConnectionString(connectionString);
}

function setAppNameParamIfMissing(
  connectionString: string,
  appName: string
): string {
  let connectionStringUrl;

  try {
    connectionStringUrl = new ConnectionString(connectionString, {
      looseValidation: true,
    });
  } catch (e) {
    //
  }

  if (!connectionStringUrl) {
    return connectionString;
  }

  const searchParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();
  if (!searchParams.has('appName')) {
    searchParams.set('appName', appName);
  }

  return connectionStringUrl.href;
}

type State = {
  activeConnectionId?: string;
  activeConnectionInfo: ConnectionInfo;
  connectingStatusText: string;
  connectionAttempt: ConnectionAttempt | null;
  connectionErrorMessage: string | null;
  connections: ConnectionInfo[];
  isConnected: boolean;
};

export function defaultConnectionsState(): State {
  return {
    activeConnectionId: undefined,
    activeConnectionInfo: createNewConnectionInfo(),
    connectingStatusText: '',
    connections: [],
    connectionAttempt: null,
    connectionErrorMessage: null,
    isConnected: false,
  };
}

type Action =
  | {
      type: 'attempt-connect';
      connectionAttempt: ConnectionAttempt;
      connectingStatusText: string;
    }
  | {
      type: 'cancel-connection-attempt';
    }
  | {
      type: 'connection-attempt-errored';
      connectionErrorMessage: string;
    }
  | {
      type: 'connection-attempt-succeeded';
    }
  | {
      type: 'new-connection';
      connectionInfo: ConnectionInfo;
    }
  | {
      type: 'set-active-connection';
      connectionInfo: ConnectionInfo;
    }
  | {
      type: 'set-connections';
      connections: ConnectionInfo[];
    }
  | {
      type: 'set-connections-and-select';
      connections: ConnectionInfo[];
      activeConnectionInfo: ConnectionInfo;
    };

export function connectionsReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'attempt-connect':
      return {
        ...state,
        connectionAttempt: action.connectionAttempt,
        connectingStatusText: action.connectingStatusText,
        connectionErrorMessage: null,
      };
    case 'cancel-connection-attempt':
      return {
        ...state,
        connectionAttempt: null,
        connectionErrorMessage: null,
      };
    case 'connection-attempt-succeeded':
      return {
        ...state,
        connectionAttempt: null,
        isConnected: true,
        connectionErrorMessage: null,
      };
    case 'connection-attempt-errored':
      return {
        ...state,
        connectionAttempt: null,
        connectionErrorMessage: action.connectionErrorMessage,
      };
    case 'set-active-connection':
      return {
        ...state,
        activeConnectionId: action.connectionInfo.id,
        activeConnectionInfo: action.connectionInfo,
        connectionErrorMessage: null,
      };
    case 'new-connection':
      return {
        ...state,
        activeConnectionId: action.connectionInfo.id,
        activeConnectionInfo: action.connectionInfo,
        connectionErrorMessage: null,
      };
    case 'set-connections':
      return {
        ...state,
        connections: action.connections,
        connectionErrorMessage: null,
      };
    case 'set-connections-and-select':
      return {
        ...state,
        connections: action.connections,
        activeConnectionId: action.activeConnectionInfo.id,
        activeConnectionInfo: action.activeConnectionInfo,
        connectionErrorMessage: null,
      };
    default:
      return state;
  }
}

async function loadConnections(
  dispatch: React.Dispatch<{
    type: 'set-connections';
    connections: ConnectionInfo[];
  }>,
  connectionStorage: ConnectionStorage
) {
  try {
    const loadedConnections = await connectionStorage.loadAll();

    dispatch({
      type: 'set-connections',
      connections: loadedConnections,
    });
  } catch (error) {
    debug('error loading connections', error);
  }
}

const MAX_RECENT_CONNECTIONS_LENGTH = 10;
export function useConnections({
  onConnected,
  connectionStorage,
  appName,
  connectFn,
}: {
  onConnected: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => void;
  connectionStorage: ConnectionStorage;
  connectFn: (connectionOptions: ConnectionOptions) => Promise<DataService>;
  appName: string;
}): {
  state: State;
  recentConnections: ConnectionInfo[];
  favoriteConnections: ConnectionInfo[];
  cancelConnectionAttempt: () => void;
  connect: (connectionInfo: ConnectionInfo) => Promise<void>;
  createNewConnection: () => void;
  saveConnection: (connectionInfo: ConnectionInfo) => Promise<void>;
  setActiveConnectionById: (newConnectionId: string) => void;
  removeAllRecentsConnections: () => Promise<void>;
  duplicateConnection: (connectioInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
} {
  const { openToast } = useToast('compass-connections');

  const [state, dispatch]: [State, React.Dispatch<Action>] = useReducer(
    connectionsReducer,
    defaultConnectionsState()
  );
  const { activeConnectionId, isConnected, connectionAttempt, connections } =
    state;

  const connectingConnectionAttempt = useRef<ConnectionAttempt>();

  const { recentConnections, favoriteConnections } = useMemo(() => {
    const favoriteConnections = (state.connections || [])
      .filter((connectionInfo) => !!connectionInfo.favorite)
      .sort((a, b) => {
        const aName = a.favorite?.name?.toLocaleLowerCase() || '';
        const bName = b.favorite?.name?.toLocaleLowerCase() || '';
        return bName < aName ? 1 : -1;
      });

    const recentConnections = (state.connections || [])
      .filter((connectionInfo) => !connectionInfo.favorite)
      .sort((a, b) => {
        const aTime = a.lastUsed?.getTime() ?? 0;
        const bTime = b.lastUsed?.getTime() ?? 0;
        return bTime - aTime;
      });

    return { recentConnections, favoriteConnections };
  }, [state.connections]);

  async function saveConnectionInfo(
    connectionInfo: ConnectionInfo
  ): Promise<boolean> {
    try {
      ensureWellFormedConnectionString(
        connectionInfo?.connectionOptions?.connectionString
      );
      await connectionStorage.save(connectionInfo);
      debug(`saved connection with id ${connectionInfo.id || ''}`);

      return true;
    } catch (err) {
      debug(
        `error saving connection with id ${connectionInfo.id || ''}: ${
          (err as Error).message
        }`
      );

      openToast('save-connection-error', {
        title: 'Error',
        variant: ToastVariant.Warning,
        body: `An error occurred while saving the connection. ${
          (err as Error).message
        }`,
      });

      return false;
    }
  }

  async function removeConnection(connectionInfo: ConnectionInfo) {
    await connectionStorage.delete(connectionInfo);
    dispatch({
      type: 'set-connections',
      connections: connections.filter((conn) => conn.id !== connectionInfo.id),
    });
    if (activeConnectionId === connectionInfo.id) {
      const nextActiveConnection = createNewConnectionInfo();
      dispatch({
        type: 'set-active-connection',
        connectionInfo: nextActiveConnection,
      });
    }
  }

  const onConnectSuccess = useCallback(
    async (connectionInfo: ConnectionInfo, dataService: DataService) => {
      try {
        onConnected(connectionInfo, dataService);

        // if a connection has been saved already we only want to update the lastUsed
        // attribute, otherwise we are going to save the entire connection info.
        const connectionInfoToBeSaved =
          (await connectionStorage.load(connectionInfo.id)) ?? connectionInfo;

        await saveConnectionInfo({
          ...cloneDeep(connectionInfoToBeSaved),
          lastUsed: new Date(),
        });

        // Remove the oldest recent connection if are adding a new one and
        // there are already MAX_RECENT_CONNECTIONS_LENGTH recents.
        // NOTE: there are edge cases that may lead to more than
        // MAX_RECENT_CONNECTIONS_LENGTH to be saved (ie. concurrent run
        // of Compass), however we accept it as long as the list of
        // recent connections won't grow indefinitely.
        if (
          !connectionInfoToBeSaved.favorite &&
          !connectionInfoToBeSaved.lastUsed &&
          recentConnections.length >= MAX_RECENT_CONNECTIONS_LENGTH
        ) {
          await connectionStorage.delete(
            recentConnections[recentConnections.length - 1]
          );
        }
      } catch (err) {
        debug(
          `error occurred connection with id ${connectionInfo.id || ''}: ${
            (err as Error).message
          }`
        );
      }
    },
    [
      onConnected,
      connectionStorage,
      saveConnectionInfo,
      removeConnection,
      recentConnections,
    ]
  );

  useEffect(() => {
    // Load connections after first render.
    void loadConnections(dispatch, connectionStorage);

    return () => {
      // When unmounting, clean up any current connection attempts that have
      // not resolved.
      if (
        connectingConnectionAttempt.current &&
        !connectingConnectionAttempt.current.isClosed()
      ) {
        connectingConnectionAttempt.current.cancelConnectionAttempt();
      }
    };
  }, []);

  const connect = async (connectionInfo: ConnectionInfo) => {
    if (connectionAttempt || isConnected) {
      // Ensure we aren't currently connecting.
      return;
    }

    const newConnectionAttempt = createConnectionAttempt(connectFn);
    connectingConnectionAttempt.current = newConnectionAttempt;

    dispatch({
      type: 'attempt-connect',
      connectingStatusText: `Connecting to ${getConnectionTitle(
        connectionInfo
      )}`,
      connectionAttempt: newConnectionAttempt,
    });

    trackConnectionAttemptEvent(connectionInfo);
    debug('connecting with connectionInfo', connectionInfo);

    try {
      const connectionStringWithAppName = setAppNameParamIfMissing(
        connectionInfo.connectionOptions.connectionString,
        appName
      );
      const newConnectionDataService = await newConnectionAttempt.connect({
        ...adjustConnectionOptionsBeforeConnect(
          connectionInfo.connectionOptions
        ),
        connectionString: connectionStringWithAppName,
      });
      connectingConnectionAttempt.current = undefined;

      if (!newConnectionDataService || newConnectionAttempt.isClosed()) {
        // The connection attempt was cancelled.
        return;
      }

      dispatch({
        type: 'connection-attempt-succeeded',
      });

      void onConnectSuccess(connectionInfo, newConnectionDataService);

      trackNewConnectionEvent(connectionInfo, newConnectionDataService);
      debug(
        'connection attempt succeeded with connection info',
        connectionInfo
      );
    } catch (error) {
      connectingConnectionAttempt.current = undefined;
      trackConnectionFailedEvent(connectionInfo, error as Error);
      debug('connect error', error);

      dispatch({
        type: 'connection-attempt-errored',
        connectionErrorMessage: (error as Error).message,
      });
    }
  };

  return {
    state,
    recentConnections,
    favoriteConnections,
    cancelConnectionAttempt() {
      connectionAttempt?.cancelConnectionAttempt();

      dispatch({
        type: 'cancel-connection-attempt',
      });
    },
    connect,
    createNewConnection() {
      dispatch({
        type: 'new-connection',
        connectionInfo: createNewConnectionInfo(),
      });
    },
    async saveConnection(connectionInfo: ConnectionInfo) {
      const saved = await saveConnectionInfo(connectionInfo);

      if (!saved) {
        return;
      }

      const existingConnectionIndex = connections.findIndex(
        (connection) => connection.id === connectionInfo.id
      );

      const newConnections = [...connections];

      if (existingConnectionIndex !== -1) {
        // Update the existing saved connection.
        newConnections[existingConnectionIndex] = cloneDeep(connectionInfo);
      } else {
        // Add the newly saved connection to our connections list.
        newConnections.push(cloneDeep(connectionInfo));
      }

      if (activeConnectionId === connectionInfo.id) {
        // Update the active connection if it's currently selected.
        dispatch({
          type: 'set-connections-and-select',
          connections: newConnections,
          activeConnectionInfo: cloneDeep(connectionInfo),
        });
        return;
      }

      dispatch({
        type: 'set-connections',
        connections: newConnections,
      });
    },
    setActiveConnectionById(newConnectionId: string) {
      const connection = connections.find(
        (connection) => connection.id === newConnectionId
      );
      if (connection) {
        dispatch({
          type: 'set-active-connection',
          connectionInfo: connection,
        });
      }
    },
    removeConnection,
    async duplicateConnection(connectionInfo: ConnectionInfo) {
      const duplicate: ConnectionInfo = {
        ...cloneDeep(connectionInfo),
        id: uuidv4(),
      };
      duplicate.favorite!.name += ' (copy)';

      await saveConnectionInfo(duplicate);
      dispatch({
        type: 'set-connections-and-select',
        connections: [...connections, duplicate],
        activeConnectionInfo: duplicate,
      });
    },
    async removeAllRecentsConnections() {
      const recentConnections = connections.filter((conn) => {
        return !conn.favorite;
      });
      await Promise.all(
        recentConnections.map((conn) => connectionStorage.delete(conn))
      );
      dispatch({
        type: 'set-connections',
        connections: connections.filter((conn) => {
          return conn.favorite;
        }),
      });
    },
  };
}
