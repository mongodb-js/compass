import { type Dispatch, useCallback, useEffect, useReducer } from 'react';
import type { DataService, connect } from 'mongodb-data-service';
import {
  useConnectionsManagerContext,
  CONNECTION_CANCELED_ERR,
  type ConnectionsManager,
} from '../provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/main';
import { cloneDeep, merge } from 'lodash';
import { UUID } from 'bson';
import { ConnectionString } from 'mongodb-connection-string-url';
import { useToast } from '@mongodb-js/compass-components';
import { createLogger } from '@mongodb-js/compass-logging';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionRepository } from '../provider';
import { useConnectionStorageContext } from '@mongodb-js/connection-storage/provider';

const { debug, mongoLogId, log } = createLogger('COMPASS-CONNECTIONS');

function isOIDCAuth(connectionString: string): boolean {
  const authMechanismString = (
    new ConnectionString(connectionString).searchParams.get('authMechanism') ||
    ''
  ).toUpperCase();

  return authMechanismString === 'MONGODB-OIDC';
}

type ConnectFn = typeof connect;

export type { ConnectFn };

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
    ? RecursivePartial<T[P]>
    : T[P];
};

export function createNewConnectionInfo(): ConnectionInfo {
  return {
    id: new UUID().toString(),
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };
}

type State = {
  activeConnectionId?: string;
  activeConnectionInfo: ConnectionInfo;
  connectingConnectionId: string | null;
  connectingStatusText: string;
  connectionErrorMessage: string | null;
  oidcDeviceAuthVerificationUrl: string | null;
  oidcDeviceAuthUserCode: string | null;
};

export function defaultConnectionsState(
  __TEST_INITIAL_CONNECTION_INFO?: ConnectionInfo
): State {
  return {
    activeConnectionInfo:
      __TEST_INITIAL_CONNECTION_INFO ?? createNewConnectionInfo(),
    connectingStatusText: '',
    connectingConnectionId: null,
    connectionErrorMessage: null,
    oidcDeviceAuthVerificationUrl: null,
    oidcDeviceAuthUserCode: null,
  };
}

type Action =
  | {
      type: 'attempt-connect';
      connectingStatusText: string;
      connectingConnectionId: string;
    }
  | {
      type: 'oidc-attempt-connect-notify-device-auth';
      verificationUrl: string;
      userCode: string;
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
    };

export function connectionsReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'attempt-connect':
      return {
        ...state,
        connectingConnectionId: action.connectingConnectionId,
        connectingStatusText: action.connectingStatusText,
        connectionErrorMessage: null,
        oidcDeviceAuthVerificationUrl: null,
        oidcDeviceAuthUserCode: null,
      };
    case 'cancel-connection-attempt':
      return {
        ...state,
        connectingConnectionId: null,
        connectionErrorMessage: null,
      };
    case 'connection-attempt-succeeded':
      return {
        ...state,
        connectingConnectionId: null,
        connectionErrorMessage: null,
      };
    case 'connection-attempt-errored':
      return {
        ...state,
        connectingConnectionId: null,
        connectionErrorMessage: action.connectionErrorMessage,
      };
    case 'oidc-attempt-connect-notify-device-auth':
      return {
        ...state,
        oidcDeviceAuthVerificationUrl: action.verificationUrl,
        oidcDeviceAuthUserCode: action.userCode,
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
    default:
      return state;
  }
}

interface ActiveAndInactiveConnectionsCount {
  active: number;
  inactive: number;
}

function getActiveAndInactiveCount(
  connectionsManager: ConnectionsManager,
  favoriteConnections: ConnectionInfo[],
  recentConnections: ConnectionInfo[]
): ActiveAndInactiveConnectionsCount {
  const total = favoriteConnections.length + recentConnections.length;
  const active = connectionsManager.getConnectionsByStatus().connected.length;
  return { active, inactive: total - active };
}

export function useConnections({
  onConnected,
  onConnectionFailed,
  onConnectionAttemptStarted,
  __TEST_INITIAL_CONNECTION_INFO,
}: {
  onConnected?: (
    connectionInfo: ConnectionInfo,
    dataService: DataService,
    activeAndInactiveConnectionsCount: ActiveAndInactiveConnectionsCount
  ) => void;
  onConnectionFailed?: (
    connectionInfo: ConnectionInfo | null,
    error: Error
  ) => void;
  onConnectionAttemptStarted?: (connectionInfo: ConnectionInfo) => void;
  __TEST_INITIAL_CONNECTION_INFO?: ConnectionInfo;
} = {}): {
  state: State;
  recentConnections: ConnectionInfo[];
  favoriteConnections: ConnectionInfo[];
  cancelConnectionAttempt: (
    connectionId: ConnectionInfo['id']
  ) => Promise<void>;
  connect: (connectionInfo: ConnectionInfo) => Promise<void>;
  closeConnection: (connectionId: ConnectionInfo['id']) => Promise<void>;
  createNewConnection: () => void;
  createDuplicateConnection: (connectionInfo: ConnectionInfo) => void;
  saveConnection: (connectionInfo: ConnectionInfo) => Promise<void>;
  setActiveConnectionById: (newConnectionId: string) => void;
  removeAllRecentsConnections: () => Promise<void>;
  legacyDuplicateConnection: (connectionInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
} {
  // TODO(COMPASS-7397): services should not be used directly in render method,
  // when this code is refactored to use the hadron plugin interface, storage
  // should be handled through the plugin activation lifecycle
  const connectionsManager = useConnectionsManagerContext();
  const connectionStorage = useConnectionStorageContext();
  const {
    favoriteConnections,
    nonFavoriteConnections: recentConnections,
    saveConnection,
    deleteConnection,
  } = useConnectionRepository();

  const { openToast } = useToast('compass-connections');
  const persistOIDCTokens = usePreference('persistOIDCTokens');
  const forceConnectionOptions = usePreference('forceConnectionOptions') ?? [];
  const browserCommandForOIDCAuth = usePreference('browserCommandForOIDCAuth');

  const [state, dispatch]: [State, Dispatch<Action>] = useReducer(
    connectionsReducer,
    defaultConnectionsState(__TEST_INITIAL_CONNECTION_INFO)
  );
  const { activeConnectionId } = state;

  const saveConnectionInfo = useCallback(
    async (
      connectionInfo: RecursivePartial<ConnectionInfo> &
        Pick<ConnectionInfo, 'id'>
    ) => {
      try {
        await saveConnection(connectionInfo);
        return true;
      } catch (err) {
        debug(
          `error saving connection with id ${connectionInfo.id || ''}: ${
            (err as Error).message
          }`
        );

        openToast('save-connection-error', {
          title: 'Error',
          variant: 'warning',
          description: `An error occurred while saving the connection. ${
            (err as Error).message
          }`,
        });

        return false;
      }
    },
    [openToast, saveConnection]
  );

  const removeConnection = useCallback(
    async (connectionInfo: ConnectionInfo) => {
      await deleteConnection(connectionInfo);

      if (activeConnectionId === connectionInfo.id) {
        const nextActiveConnection = createNewConnectionInfo();
        dispatch({
          type: 'set-active-connection',
          connectionInfo: nextActiveConnection,
        });
      }
    },
    [activeConnectionId, deleteConnection, dispatch]
  );

  const oidcAttemptConnectNotifyDeviceAuth = useCallback(
    (deviceFlowInformation: { verificationUrl: string; userCode: string }) => {
      dispatch({
        type: 'oidc-attempt-connect-notify-device-auth',
        verificationUrl: deviceFlowInformation.verificationUrl,
        userCode: deviceFlowInformation.userCode,
      });
    },
    [dispatch]
  );

  const oidcUpdateSecrets = useCallback(
    async (connectionInfo: ConnectionInfo, dataService: DataService) => {
      try {
        if (!persistOIDCTokens) return;

        const mergeConnectionInfo = {
          id: connectionInfo.id,
          connectionOptions: await dataService.getUpdatedSecrets(),
        };

        await saveConnectionInfo(mergeConnectionInfo);
      } catch (err: any) {
        log.warn(
          mongoLogId(1_001_000_195),
          'Connection Store',
          'Failed to update connection store with updated secrets',
          { err: err?.stack }
        );
      }
    },
    [persistOIDCTokens, saveConnectionInfo]
  );

  const onConnectSuccess = useCallback(
    async (
      connectionInfo: ConnectionInfo,
      dataService: DataService,
      shouldSaveConnectionInfo: boolean
    ) => {
      try {
        dispatch({ type: 'set-active-connection', connectionInfo });
        onConnected?.(
          connectionInfo,
          dataService,
          getActiveAndInactiveCount(
            connectionsManager,
            favoriteConnections,
            recentConnections
          )
        );
        if (!shouldSaveConnectionInfo) return;

        let mergeConnectionInfo = {};
        if (persistOIDCTokens) {
          mergeConnectionInfo = {
            connectionOptions: await dataService.getUpdatedSecrets(),
          };
        }

        await saveConnectionInfo({
          ...merge(connectionInfo, mergeConnectionInfo),
          lastUsed: new Date(),
        });
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
      persistOIDCTokens,
      saveConnectionInfo,
      connectionsManager,
      favoriteConnections,
      recentConnections,
    ]
  );

  useEffect(() => {
    if (connectionStorage.getAutoConnectInfo) {
      void connect(
        connectionStorage.getAutoConnectInfo.bind(connectionStorage),
        false
      ).catch(() => {
        // noop, we're already logging in the connect method
      });
    }
  }, [connectionStorage]);

  const closeConnection = async (connectionId: string) => {
    debug('closing connection with connectionId', connectionId);
    log.info(
      mongoLogId(1_001_000_313),
      'Connection UI',
      'Initiating disconnect attempt'
    );
    try {
      await connectionsManager.closeConnection(connectionId);
    } catch (error) {
      log.error(
        mongoLogId(1_001_000_314),
        'Connection UI',
        'Disconnect attempt failed',
        {
          error: (error as Error).message,
        }
      );
    }
    debug('connection closed', connectionId);
  };

  const connect = async (
    _connectionInfo:
      | ConnectionInfo
      | (() => Promise<ConnectionInfo | undefined>),
    shouldSaveConnectionInfo = true
  ) => {
    const isAutoconnectAttempt = typeof _connectionInfo === 'function';
    let connectionInfo: ConnectionInfo;

    try {
      if (typeof _connectionInfo === 'function') {
        log.info(
          mongoLogId(1_001_000_160),
          'Connection Store',
          'Performing automatic connection attempt'
        );
        const autoConnectInfo = await _connectionInfo();
        if (!autoConnectInfo) {
          return;
        }
        connectionInfo = autoConnectInfo;
        dispatch({ type: 'set-active-connection', connectionInfo });
      } else {
        connectionInfo = _connectionInfo;
      }

      const isOIDCConnectionAttempt = isOIDCAuth(
        connectionInfo.connectionOptions.connectionString
      );

      dispatch({
        type: 'attempt-connect',
        connectingConnectionId: connectionInfo.id,
        connectingStatusText: `Connecting to ${getConnectionTitle(
          connectionInfo
        )}${
          isOIDCConnectionAttempt
            ? '. Go to the browser to complete authentication.'
            : ''
        }`,
      });

      onConnectionAttemptStarted?.(connectionInfo);
      debug('connecting with connectionInfo', connectionInfo);
      log.info(
        mongoLogId(1001000004),
        'Connection UI',
        'Initiating connection attempt',
        { isAutoconnectAttempt }
      );

      const newConnectionDataService = await connectionsManager.connect(
        connectionInfo,
        {
          forceConnectionOptions,
          browserCommandForOIDCAuth,
          onDatabaseSecretsChange: (
            connectionInfo: ConnectionInfo,
            dataService: DataService
          ) => void oidcUpdateSecrets(connectionInfo, dataService),
          onNotifyOIDCDeviceFlow: oidcAttemptConnectNotifyDeviceAuth,
        }
      );

      dispatch({
        type: 'connection-attempt-succeeded',
      });

      void onConnectSuccess(
        connectionInfo,
        newConnectionDataService,
        shouldSaveConnectionInfo
      );

      debug(
        'connection attempt succeeded with connection info',
        connectionInfo
      );
    } catch (error) {
      if ((error as Error).message === CONNECTION_CANCELED_ERR) {
        dispatch({
          type: 'cancel-connection-attempt',
        });
      } else {
        onConnectionFailed?.(connectionInfo! ?? null, error as Error);

        log.error(
          mongoLogId(1_001_000_161),
          'Connection Store',
          'Error performing connection attempt',
          {
            error: (error as Error).message,
            isAutoconnectAttempt,
          }
        );

        dispatch({
          type: 'connection-attempt-errored',
          connectionErrorMessage: (error as Error).message,
        });
      }
      throw error;
    }
  };

  return {
    state,
    recentConnections,
    favoriteConnections,
    async cancelConnectionAttempt(connectionInfoId: string) {
      log.info(
        mongoLogId(1001000005),
        'Connection UI',
        'Canceling connection attempt'
      );
      try {
        await connectionsManager.closeConnection(connectionInfoId);
      } catch (error) {
        log.error(
          mongoLogId(1_001_000_303),
          'Connection UI',
          'Canceling connection attempt failed',
          {
            error: (error as Error).message,
          }
        );
      }
    },
    connect,
    closeConnection,
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

      if (activeConnectionId === connectionInfo.id) {
        // Update the active connection if it's currently selected.
        dispatch({
          type: 'set-active-connection',
          connectionInfo: cloneDeep(connectionInfo),
        });
        return;
      }
    },
    setActiveConnectionById(newConnectionId: string) {
      const connection = [...favoriteConnections, ...recentConnections].find(
        (connection) => connection.id === newConnectionId
      );
      if (connection) {
        dispatch({
          type: 'set-active-connection',
          connectionInfo: connection,
        });
      }
    },
    removeConnection(connectionInfo) {
      void removeConnection(connectionInfo);
    },
    legacyDuplicateConnection(connectionInfo: ConnectionInfo) {
      const findConnectionByFavoriteName = (name: string) =>
        [...favoriteConnections, ...recentConnections].find(
          (connection: ConnectionInfo) => connection.favorite?.name === name
        );
      const duplicate: ConnectionInfo = {
        ...cloneDeep(connectionInfo),
        id: new UUID().toString(),
      };

      if (duplicate.favorite?.name) {
        const copyFormat = duplicate.favorite?.name.match(/(.*)\s\(([0-9])+\)/); // title (2) -> [title (2), title, 2]
        const name = copyFormat ? copyFormat[1] : duplicate.favorite?.name;
        let copyNumber = copyFormat ? parseInt(copyFormat[2]) : 1;
        while (findConnectionByFavoriteName(`${name} (${copyNumber})`)) {
          copyNumber++;
        }
        duplicate.favorite.name = `${name} (${copyNumber})`;
      }

      void saveConnectionInfo(duplicate).then(
        () => {
          dispatch({
            type: 'set-active-connection',
            connectionInfo: duplicate,
          });
        },
        () => {
          // We do nothing when if it fails
        }
      );
    },
    createDuplicateConnection(connectionInfo: ConnectionInfo) {
      const findConnectionByFavoriteName = (name: string) =>
        [...favoriteConnections, ...recentConnections].find(
          (connection: ConnectionInfo) => connection.favorite?.name === name
        );

      const duplicate: ConnectionInfo = {
        ...cloneDeep(connectionInfo),
        id: new UUID().toString(),
      };

      if (duplicate.favorite?.name) {
        const copyFormat = duplicate.favorite?.name.match(/(.*)\s\(([0-9])+\)/); // title (2) -> [title (2), title, 2]
        const name = copyFormat ? copyFormat[1] : duplicate.favorite?.name;
        let copyNumber = copyFormat ? parseInt(copyFormat[2]) : 1;
        while (findConnectionByFavoriteName(`${name} (${copyNumber})`)) {
          copyNumber++;
        }
        duplicate.favorite.name = `${name} (${copyNumber})`;
      }

      dispatch({
        type: 'new-connection',
        connectionInfo: duplicate,
      });
    },
    async removeAllRecentsConnections() {
      await Promise.all(
        recentConnections.map((info) => deleteConnection(info))
      );
    },
  };
}
