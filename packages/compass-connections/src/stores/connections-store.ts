import React from 'react';
import type { DataService, connect } from 'mongodb-data-service';
import type {
  ConnectionInfo,
  ConnectionStorage,
} from '@mongodb-js/connection-storage/renderer';
import { getConnectionTitle } from '@mongodb-js/connection-storage/renderer';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { cloneDeep, merge } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import type { ConnectionAttempt } from '../modules/connection-attempt';
import { createConnectionAttempt } from '../modules/connection-attempt';
import {
  trackConnectionAttemptEvent,
  trackNewConnectionEvent,
  trackConnectionFailedEvent,
} from '../modules/telemetry';
import ConnectionString from 'mongodb-connection-string-url';
import { adjustConnectionOptionsBeforeConnect } from '@mongodb-js/connection-form';
import { useEffectOnChange, useToast } from '@mongodb-js/compass-components';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import preferences, { usePreference } from 'compass-preferences-model';

const { debug, mongoLogId, log } = createLoggerAndTelemetry(
  'COMPASS-CONNECTIONS'
);

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

function isOIDCAuth(connectionString: string): boolean {
  const authMechanismString = (
    new ConnectionString(connectionString).searchParams.get('authMechanism') ||
    ''
  ).toUpperCase();

  return authMechanismString === 'MONGODB-OIDC';
}

function ensureWellFormedConnectionString(connectionString: string) {
  new ConnectionString(connectionString);
}

type State = {
  activeConnectionId?: string;
  activeConnectionInfo: ConnectionInfo;
  connectingStatusText: string;
  connectionAttempt: ConnectionAttempt | null;
  connectionErrorMessage: string | null;
  connections: ConnectionInfo[];
  oidcDeviceAuthVerificationUrl: string | null;
  oidcDeviceAuthUserCode: string | null;
  // Additional connection information that is merged with the connection info
  // when connecting. This is useful for instances like OIDC sessions where we
  // have a setting on the system for storing credentials.
  // When the setting is on this `connectionMergeInfos` would have the session
  // credential information and merge it before connecting.
  connectionMergeInfos: Record<string, RecursivePartial<ConnectionInfo>>;
};

export function defaultConnectionsState(): State {
  return {
    activeConnectionId: undefined,
    activeConnectionInfo: createNewConnectionInfo(),
    connectingStatusText: '',
    connections: [],
    connectionAttempt: null,
    connectionErrorMessage: null,
    oidcDeviceAuthVerificationUrl: null,
    oidcDeviceAuthUserCode: null,
    connectionMergeInfos: {},
  };
}

type Action =
  | {
      type: 'attempt-connect';
      connectionAttempt: ConnectionAttempt;
      connectingStatusText: string;
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
    }
  | {
      type: 'set-connections';
      connections: ConnectionInfo[];
    }
  | {
      type: 'set-connections-and-select';
      connections: ConnectionInfo[];
      activeConnectionInfo: ConnectionInfo;
    }
  | {
      type: 'add-connection-merge-info';
      id: string;
      mergeConnectionInfo: RecursivePartial<ConnectionInfo>;
    };

export function connectionsReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'attempt-connect':
      return {
        ...state,
        connectionAttempt: action.connectionAttempt,
        connectingStatusText: action.connectingStatusText,
        connectionErrorMessage: null,
        oidcDeviceAuthVerificationUrl: null,
        oidcDeviceAuthUserCode: null,
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
        connectionErrorMessage: null,
      };
    case 'connection-attempt-errored':
      return {
        ...state,
        connectionAttempt: null,
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
    case 'add-connection-merge-info':
      return {
        ...state,
        connectionMergeInfos: {
          ...state.connectionMergeInfos,
          [action.id]: merge(
            cloneDeep(state.connectionMergeInfos[action.id]),
            action.mergeConnectionInfo
          ),
        },
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
  connectionStorage: typeof ConnectionStorage
) {
  try {
    const loadedConnections = await connectionStorage.loadAll();
    const toBeReSaved: ConnectionInfo[] = [];

    // Scrub OIDC tokens from connections when the option to store them has been disabled
    if (!preferences.getPreferences().persistOIDCTokens) {
      for (const connection of loadedConnections) {
        if (connection.connectionOptions.oidc?.serializedState) {
          delete connection.connectionOptions.oidc?.serializedState;
          toBeReSaved.push(connection);
        }
      }
    }

    dispatch({
      type: 'set-connections',
      connections: loadedConnections,
    });

    await Promise.all(
      toBeReSaved.map(async (connectionInfo) => {
        await connectionStorage.save({ connectionInfo });
      })
    );
  } catch (error) {
    debug('error loading connections', error);
  }
}

export function useConnections({
  onConnected,
  isConnected,
  connectionStorage,
  appName,
  getAutoConnectInfo,
  connectFn,
}: {
  onConnected: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => void;
  isConnected: boolean;
  connectionStorage: typeof ConnectionStorage;
  getAutoConnectInfo?: () => Promise<ConnectionInfo | undefined>;
  connectFn: ConnectFn;
  appName: string;
}): {
  state: State;
  recentConnections: ConnectionInfo[];
  favoriteConnections: ConnectionInfo[];
  cancelConnectionAttempt: () => void;
  connect: (
    connectionInfo: ConnectionInfo | (() => Promise<ConnectionInfo>)
  ) => Promise<void>;
  createNewConnection: () => void;
  saveConnection: (connectionInfo: ConnectionInfo) => Promise<void>;
  setActiveConnectionById: (newConnectionId: string) => void;
  removeAllRecentsConnections: () => Promise<void>;
  duplicateConnection: (connectioInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
  reloadConnections: () => void;
} {
  const { openToast } = useToast('compass-connections');

  const [state, dispatch]: [State, React.Dispatch<Action>] = useReducer(
    connectionsReducer,
    defaultConnectionsState()
  );
  const { activeConnectionId, connectionAttempt, connections } = state;

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
      await connectionStorage.save({ connectionInfo });
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
        variant: 'warning',
        description: `An error occurred while saving the connection. ${
          (err as Error).message
        }`,
      });

      return false;
    }
  }

  async function removeConnection(connectionInfo: ConnectionInfo) {
    await connectionStorage.delete({
      id: connectionInfo.id,
    });
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
    async (
      connectionInfo: ConnectionInfo,
      dataService: DataService,
      shouldSaveConnectionInfo: boolean
    ) => {
      try {
        onConnected(connectionInfo, dataService);

        if (!shouldSaveConnectionInfo) return;

        let mergeConnectionInfo = {};
        if (preferences.getPreferences().persistOIDCTokens) {
          mergeConnectionInfo = {
            connectionOptions: await dataService.getUpdatedSecrets(),
          };
          dispatch({
            type: 'add-connection-merge-info',
            id: connectionInfo.id,
            mergeConnectionInfo,
          });
        }

        // if a connection has been saved already we only want to update the lastUsed
        // attribute, otherwise we are going to save the entire connection info.
        const connectionInfoToBeSaved =
          (await connectionStorage.load({ id: connectionInfo.id })) ??
          connectionInfo;

        await saveConnectionInfo({
          ...merge(connectionInfoToBeSaved, mergeConnectionInfo),
          lastUsed: new Date(),
        });

        // ?. because mocks in tests don't provide it
        dataService.on?.('connectionInfoSecretsChanged', () => {
          void (async () => {
            try {
              if (!preferences.getPreferences().persistOIDCTokens) return;
              // Get updated secrets first (and not in parallel) so that the
              // race condition window between load() and save() is as short as possible.
              const mergeConnectionInfo = {
                connectionOptions: await dataService.getUpdatedSecrets(),
              };
              if (!mergeConnectionInfo) return;
              dispatch({
                type: 'add-connection-merge-info',
                id: connectionInfo.id,
                mergeConnectionInfo,
              });
              const currentSavedInfo = await connectionStorage.load({
                id: connectionInfo.id,
              });
              if (!currentSavedInfo) return;
              await saveConnectionInfo(
                merge(currentSavedInfo, mergeConnectionInfo)
              );
            } catch (err: any) {
              log.warn(
                mongoLogId(1_001_000_195),
                'Connection Store',
                'Failed to update connection store with updated secrets',
                { err: err?.stack }
              );
            }
          })();
        });
      } catch (err) {
        debug(
          `error occurred connection with id ${connectionInfo.id || ''}: ${
            (err as Error).message
          }`
        );
      }
    },
    [onConnected, connectionStorage, saveConnectionInfo, removeConnection]
  );

  useEffect(() => {
    // Load connections after first render.
    void loadConnections(dispatch, connectionStorage);

    if (getAutoConnectInfo) {
      log.info(
        mongoLogId(1_001_000_160),
        'Connection Store',
        'Performing automatic connection attempt'
      );
      void connect(getAutoConnectInfo);
    }

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
  }, [getAutoConnectInfo]);

  const persistOIDCTokens = usePreference('persistOIDCTokens', React);
  useEffectOnChange(() => {
    if (!persistOIDCTokens) void loadConnections(dispatch, connectionStorage);
  }, [persistOIDCTokens]);

  const connect = async (
    getAutoConnectInfo:
      | ConnectionInfo
      | (() => Promise<ConnectionInfo | undefined>)
  ) => {
    if (connectionAttempt || isConnected) {
      // Ensure we aren't currently connecting.
      return;
    }

    const newConnectionAttempt = createConnectionAttempt(connectFn);
    connectingConnectionAttempt.current = newConnectionAttempt;

    let connectionInfo: ConnectionInfo | undefined = undefined;
    let shouldSaveConnectionInfo = false;
    try {
      if (typeof getAutoConnectInfo === 'function') {
        connectionInfo = await getAutoConnectInfo();
        if (!connectionInfo) {
          connectingConnectionAttempt.current = undefined;
          return;
        }

        dispatch({
          type: 'set-active-connection',
          connectionInfo,
        });
      } else {
        connectionInfo = getAutoConnectInfo;
        shouldSaveConnectionInfo = true;
      }

      connectionInfo = merge(
        cloneDeep(connectionInfo),
        state.connectionMergeInfos[connectionInfo.id] ?? {}
      );

      const isOIDCConnectionAttempt = isOIDCAuth(
        connectionInfo.connectionOptions.connectionString
      );
      dispatch({
        type: 'attempt-connect',
        connectingStatusText: `Connecting to ${getConnectionTitle(
          connectionInfo
        )}${
          isOIDCConnectionAttempt
            ? '. Go to the browser to complete authentication.'
            : ''
        }`,
        connectionAttempt: newConnectionAttempt,
      });

      trackConnectionAttemptEvent(connectionInfo);
      debug('connecting with connectionInfo', connectionInfo);

      let notifyDeviceFlow:
        | ((deviceFlowInformation: {
            verificationUrl: string;
            userCode: string;
          }) => void)
        | undefined;
      if (isOIDCConnectionAttempt) {
        notifyDeviceFlow = (deviceFlowInformation: {
          verificationUrl: string;
          userCode: string;
        }) => {
          dispatch({
            type: 'oidc-attempt-connect-notify-device-auth',
            verificationUrl: deviceFlowInformation.verificationUrl,
            userCode: deviceFlowInformation.userCode,
          });
        };
      }

      const { forceConnectionOptions = [], browserCommandForOIDCAuth } =
        preferences.getPreferences();

      const newConnectionDataService = await newConnectionAttempt.connect(
        adjustConnectionOptionsBeforeConnect({
          connectionOptions: connectionInfo.connectionOptions,
          defaultAppName: appName,
          notifyDeviceFlow,
          preferences: { forceConnectionOptions, browserCommandForOIDCAuth },
        })
      );
      connectingConnectionAttempt.current = undefined;

      if (!newConnectionDataService || newConnectionAttempt.isClosed()) {
        // The connection attempt was cancelled.
        return;
      }

      dispatch({
        type: 'connection-attempt-succeeded',
      });

      void onConnectSuccess(
        connectionInfo,
        newConnectionDataService,
        shouldSaveConnectionInfo
      );

      trackNewConnectionEvent(connectionInfo, newConnectionDataService);
      debug(
        'connection attempt succeeded with connection info',
        connectionInfo
      );
    } catch (error) {
      connectingConnectionAttempt.current = undefined;
      if (connectionInfo) {
        trackConnectionFailedEvent(connectionInfo, error as Error);
      }
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
      saveConnectionInfo(duplicate).then(
        () => {
          dispatch({
            type: 'set-connections-and-select',
            connections: [...connections, duplicate],
            activeConnectionInfo: duplicate,
          });
        },
        () => {
          // We do nothing when if it fails
        }
      );
    },
    async removeAllRecentsConnections() {
      const recentConnections = connections.filter((conn) => {
        return !conn.favorite;
      });
      await Promise.all(
        recentConnections.map(({ id }) => connectionStorage.delete({ id }))
      );
      dispatch({
        type: 'set-connections',
        connections: connections.filter((conn) => {
          return conn.favorite;
        }),
      });
    },
    reloadConnections() {
      void loadConnections(dispatch, connectionStorage);
    },
  };
}
