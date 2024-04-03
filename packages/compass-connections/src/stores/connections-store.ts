import { type Dispatch, useCallback, useEffect, useReducer } from 'react';
import type { DataService, connect } from 'mongodb-data-service';
import {
  useConnectionsManagerContext,
  CONNECTION_CANCELED_ERR,
} from '../provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/main';
import { cloneDeep, merge } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ConnectionString } from 'mongodb-connection-string-url';
import { useToast } from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionRepository } from '../hooks/use-connection-repository';

const { debug, mongoLogId, log } = createLoggerAndTelemetry(
  'COMPASS-CONNECTIONS'
);

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
    id: uuidv4(),
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

export function defaultConnectionsState(): State {
  return {
    activeConnectionInfo: createNewConnectionInfo(),
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

export function useConnections({
  onConnected,
  onConnectionFailed,
  onConnectionAttemptStarted,
  appName,
  getAutoConnectInfo,
}: {
  onConnected: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => void;
  onConnectionFailed: (
    connectionInfo: ConnectionInfo | null,
    error: Error
  ) => void;
  onConnectionAttemptStarted: (connectionInfo: ConnectionInfo) => void;
  getAutoConnectInfo?: () => Promise<ConnectionInfo | undefined>;
  appName: string;
}): {
  state: State;
  recentConnections: ConnectionInfo[];
  favoriteConnections: ConnectionInfo[];
  cancelConnectionAttempt: (connectionInfoId: string) => Promise<void>;
  connect: (connectionInfo: ConnectionInfo) => Promise<void>;
  createNewConnection: () => void;
  saveConnection: (connectionInfo: ConnectionInfo) => Promise<void>;
  setActiveConnectionById: (newConnectionId: string) => void;
  removeAllRecentsConnections: () => Promise<void>;
  duplicateConnection: (connectionInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
} {
  // TODO(COMPASS-7397): services should not be used directly in render method,
  // when this code is refactored to use the hadron plugin interface, storage
  // should be handled through the plugin activation lifecycle
  const connectionsManager = useConnectionsManagerContext();
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
    defaultConnectionsState()
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
        onConnected(connectionInfo, dataService);

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
    [onConnected, saveConnectionInfo, persistOIDCTokens]
  );

  useEffect(() => {
    // Load connections after first render.
    void connectWithAutoConnectInfoIfAvailable();
    async function connectWithAutoConnectInfoIfAvailable() {
      let connectionInfo: ConnectionInfo | undefined;
      try {
        connectionInfo =
          typeof getAutoConnectInfo === 'function'
            ? await getAutoConnectInfo()
            : undefined;
        if (connectionInfo) {
          log.info(
            mongoLogId(1_001_000_160),
            'Connection Store',
            'Performing automatic connection attempt'
          );
          dispatch({
            type: 'set-active-connection',
            connectionInfo,
          });
          void connect(connectionInfo, false);
        }
      } catch (error) {
        onConnectionFailed(connectionInfo ?? null, error as Error);
        log.error(
          mongoLogId(1_001_000_290),
          'Connection Store',
          'Error performing connection attempt using auto connect info',
          {
            error: (error as Error).message,
          }
        );

        dispatch({
          type: 'connection-attempt-errored',
          connectionErrorMessage: (error as Error).message,
        });
      }
    }

    return () => {
      // When unmounting, clean up any current connection attempts that have
      // not resolved.
      connectionsManager.cancelAllConnectionAttempts();
    };
  }, [getAutoConnectInfo, persistOIDCTokens]);

  const connect = async (
    connectionInfo: ConnectionInfo,
    shouldSaveConnectionInfo = true
  ) => {
    const isOIDCConnectionAttempt = isOIDCAuth(
      connectionInfo.connectionOptions.connectionString
    );

    try {
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

      onConnectionAttemptStarted(connectionInfo);
      debug('connecting with connectionInfo', connectionInfo);
      log.info(
        mongoLogId(1001000004),
        'Connection UI',
        'Initiating connection attempt'
      );

      const newConnectionDataService = await connectionsManager.connect(
        connectionInfo,
        {
          appName,
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
        originalConnectionInfo
      );
    } catch (error) {
      if ((error as Error).message === CONNECTION_CANCELED_ERR) {
        dispatch({
          type: 'cancel-connection-attempt',
        });
        return;
      }

      onConnectionFailed(connectionInfo, error as Error);
      log.error(
        mongoLogId(1_001_000_161),
        'Connection Store',
        'Error performing connection attempt',
        {
          error: (error as Error).message,
        }
      );

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
    duplicateConnection(connectionInfo: ConnectionInfo) {
      const duplicate: ConnectionInfo = {
        ...cloneDeep(connectionInfo),
        id: uuidv4(),
      };

      if (duplicate.favorite?.name) {
        duplicate.favorite.name += ' (copy)';
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
    async removeAllRecentsConnections() {
      await Promise.all(
        recentConnections.map((info) => deleteConnection(info))
      );
    },
  };
}
