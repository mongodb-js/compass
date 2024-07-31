import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { DataService, connect } from 'mongodb-data-service';
import { useConnectionsManagerContext } from '../provider';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { cloneDeep, merge } from 'lodash';
import { UUID } from 'bson';
import { useToast } from '@mongodb-js/compass-components';
import { createLogger } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { usePreferencesContext } from 'compass-preferences-model/provider';
import { useConnectionRepository } from '../provider';
import { useConnectionStorageContext } from '@mongodb-js/connection-storage/provider';
import { useConnectionStatusToasts } from '../components/connection-status-toasts';
import { isCancelError } from '@mongodb-js/compass-utils';
import { showNonGenuineMongoDBWarningModal as _showNonGenuineMongoDBWarningModal } from '../components/non-genuine-connection-modal';
import { getGenuineMongoDB } from 'mongodb-build-info';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import {
  trackConnectionCreatedEvent,
  trackConnectionDisconnectedEvent,
  trackConnectionRemovedEvent,
} from '../utils/telemetry';

const { debug, mongoLogId, log } = createLogger('COMPASS-CONNECTIONS');

type ConnectFn = typeof connect;

export type { ConnectFn };

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
    ? RecursivePartial<T[P]>
    : T[P];
};

export type PartialConnectionInfo = Pick<ConnectionInfo, 'id'> &
  RecursivePartial<ConnectionInfo>;

export function createNewConnectionInfo(): ConnectionInfo {
  return {
    id: new UUID().toString(),
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };
}

const InFlightConnections = new Map<string, PromiseLike<void>>();

// TODO(COMPASS-7397): Only contains state that is required for the connection
// flow but can't be accessed from connection storage, connections manager, or
// connections repository. Following-up we will be converting this to a redux
// store and merging connection manager and connection repository state to this
// store
type State = {
  connectionErrors: Record<string, Error>;
  editingConnectionInfo: ConnectionInfo | null;
  isEditingConnectionInfoModalOpen: boolean;
  oidcDeviceAuthState: Record<string, { url: string; code: string }>;
};

type Action =
  | {
      // When user triggered connection for a certain connection info through
      // the UI
      type: 'attempt-connect';
      connectionInfo: ConnectionInfo;
      isAutoConnect: boolean;
    }
  | {
      // When connection attempt resolved with success
      type: 'connection-attempt-succeeded';
      connectionInfo: ConnectionInfo;
    }
  | {
      // When connection attempt failed with an error
      type: 'connection-attempt-errored';
      connectionInfo: ConnectionInfo;
      error: Error;
      isAutoConnect: boolean;
    }
  | {
      // When connection process requires user to go through the OIDC device
      // auth flow that requires manually opening a link and posting a code in
      // the browser
      type: 'oidc-attempt-connect-notify-device-auth';
      connectionInfo: ConnectionInfo;
      verificationUrl: string;
      userCode: string;
    }
  | {
      // When user creates a new, "empty" connection from anywhere in the app
      type: 'new-connection';
    }
  | {
      // When user duplicates an existing connection from the sidebar actions UI
      type: 'duplicate-connection';
      connectionInfo: ConnectionInfo;
      autoDuplicate: boolean;
    }
  | {
      // When user opens a connection for editing from anywhere in the app
      type: 'edit-connection';
      connectionInfo: ConnectionInfo;
    }
  | {
      // When user saves changes on an edited connection
      type: 'save-edited-connection';
      connectionInfo: ConnectionInfo | null;
    }
  | {
      // When user cancels editing without connecting or saving the connection
      type: 'cancel-edit-connection';
    }
  | {
      // When user deletes connection using the sidebar actions UI
      type: 'delete-connection';
      connectionInfo: ConnectionInfo;
    };

export const createConnectionsReducer = (preferences: PreferencesAccess) => {
  return (state: State, action: Action): State => {
    switch (action.type) {
      case 'attempt-connect':
        return {
          ...state,
          // Autoconnect is a bit of a special case where we preset the
          // connection form with the autoconnect info so that if it fails in
          // single connection mode, the form is pre-populated as expected
          editingConnectionInfo: action.isAutoConnect
            ? action.connectionInfo
            : state.editingConnectionInfo,
          isEditingConnectionInfoModalOpen:
            // Close connection editing modal when connection starts
            action.connectionInfo.id === state.editingConnectionInfo?.id
              ? false
              : state.isEditingConnectionInfoModalOpen,
        };
      case 'connection-attempt-succeeded': {
        const connectionErrors = { ...state.connectionErrors };
        delete connectionErrors[action.connectionInfo.id];

        const oidcDeviceAuthState = { ...state.oidcDeviceAuthState };
        delete oidcDeviceAuthState[action.connectionInfo.id];

        return {
          ...state,
          connectionErrors,
          oidcDeviceAuthState,
        };
      }
      case 'connection-attempt-errored':
        return {
          ...state,
          editingConnectionInfo:
            // Autoconnect special case for single connection: if we failed when
            // autoconnecting, there might be no info set in the form yet if we
            // failed while trying to read the autoconnect info. For that case
            // we prepopulate the editing state so that the form can map the
            // error correctly
            action.isAutoConnect && !state.editingConnectionInfo
              ? action.connectionInfo
              : state.editingConnectionInfo,
          connectionErrors: {
            ...state.connectionErrors,
            [action.connectionInfo.id]: action.error,
          },
        };
      case 'oidc-attempt-connect-notify-device-auth':
        return {
          ...state,
          oidcDeviceAuthState: {
            ...state.oidcDeviceAuthState,
            [action.connectionInfo.id]: {
              url: action.verificationUrl,
              code: action.userCode,
            },
          },
        };
      case 'new-connection':
        return {
          ...state,
          editingConnectionInfo: createNewConnectionInfo(),
          isEditingConnectionInfoModalOpen: true,
        };
      case 'duplicate-connection':
        return {
          ...state,
          editingConnectionInfo: action.connectionInfo,
          isEditingConnectionInfoModalOpen: action.autoDuplicate
            ? // When autoduplicating we just save a copy right away without
              // opening a editing modal
              state.isEditingConnectionInfoModalOpen
            : true,
        };
      case 'edit-connection': {
        if (
          // In multiple connections mode we don't allow to start another edit
          // when one is already in progress
          preferences.getPreferences().enableNewMultipleConnectionSystem &&
          state.isEditingConnectionInfoModalOpen
        ) {
          return state;
        }

        // Do not update the state if we're already editing the same connection
        if (
          state.isEditingConnectionInfoModalOpen &&
          state.editingConnectionInfo?.id === action.connectionInfo.id
        ) {
          return state;
        }

        const connectionErrors = { ...state.connectionErrors };

        // When switching from one connection editing form to another, reset the
        // errors on the previous one
        if (
          state.editingConnectionInfo &&
          action.connectionInfo.id !== state.editingConnectionInfo.id
        ) {
          delete connectionErrors[state.editingConnectionInfo.id];
        }

        return {
          ...state,
          connectionErrors,
          editingConnectionInfo: action.connectionInfo,
          isEditingConnectionInfoModalOpen: true,
        };
      }
      case 'save-edited-connection': {
        return {
          ...state,
          isEditingConnectionInfoModalOpen: false,
        };
      }
      case 'cancel-edit-connection': {
        return {
          ...state,
          isEditingConnectionInfoModalOpen: false,
        };
      }
      case 'delete-connection': {
        const connectionErrors = { ...state.connectionErrors };
        delete connectionErrors[action.connectionInfo.id];

        const oidcDeviceAuthState = { ...state.oidcDeviceAuthState };
        delete oidcDeviceAuthState[action.connectionInfo.id];

        const isDeletingCurrentlyEditedConnection =
          action.connectionInfo.id === state.editingConnectionInfo?.id;

        return {
          ...state,
          editingConnectionInfo: isDeletingCurrentlyEditedConnection
            ? null
            : state.editingConnectionInfo,
          isEditingConnectionInfoModalOpen: isDeletingCurrentlyEditedConnection
            ? false
            : state.isEditingConnectionInfoModalOpen,
          connectionErrors,
          oidcDeviceAuthState,
        };
      }
    }
  };
};

function useCurrentRef<T>(val: T): { current: T } {
  const ref = useRef<T>(val);
  ref.current = val;
  return ref;
}

export function useConnections({
  onConnected, // TODO(COMPASS-7397): move connection-telemetry inside connections
  onConnectionFailed,
  onConnectionAttemptStarted,
}: {
  onConnected?: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => void;
  onConnectionFailed?: (
    connectionInfo: ConnectionInfo | null,
    error: Error
  ) => void;
  onConnectionAttemptStarted?: (connectionInfo: ConnectionInfo) => void;
} = {}): {
  state: State;

  connect: (connectionInfo: ConnectionInfo) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;

  createNewConnection: () => void;
  editConnection: (connectionId: string) => void;
  saveEditedConnection: (
    connectionInfo: PartialConnectionInfo
  ) => Promise<void>;
  cancelEditConnection: (connectionId: string) => void;
  duplicateConnection: (
    connectionId: string,
    options?: { autoDuplicate: boolean }
  ) => Promise<void>;
  toggleConnectionFavoritedStatus: (connectionId: string) => Promise<void>;
  removeConnection: (connectionId: string) => Promise<void>;

  removeAllRecentConnections: () => Promise<void>;
  showNonGenuineMongoDBWarningModal: (connectionId: string) => void;

  // This state should not be here, but is the only way we can currently check
  // when those are loaded (we shouldn't be checking this in tests directly
  // either, but this is right now the only way for us to test some methods on
  // this hook)
  favoriteConnections: ConnectionInfo[];
  recentConnections: ConnectionInfo[];
} {
  const track = useTelemetry();
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
    getConnectionInfoById,
    filterConnectionInfo,
    reduceConnectionInfo,
  } = useConnectionRepository();
  const preferences = usePreferencesContext();

  const reducer = useRef(createConnectionsReducer(preferences));
  const [state, dispatch] = useReducer(reducer.current, {
    connectionErrors: {},
    editingConnectionInfo: null,
    isEditingConnectionInfoModalOpen: false,
    oidcDeviceAuthState: {},
  });

  const onConnectionAttemptStartedRef = useCurrentRef(
    onConnectionAttemptStarted
  );
  const onConnectedRef = useCurrentRef(onConnected);
  const onConnectionFailedRef = useCurrentRef(onConnectionFailed);

  const { openToast } = useToast('compass-connections');
  const {
    openConnectionStartedToast,
    openConnectionSucceededToast,
    openConnectionFailedToast,
    openMaximumConnectionsReachedToast,
    closeConnectionStatusToast,
  } = useConnectionStatusToasts();

  const saveConnectionInfo = useCallback(
    async (connectionInfo: PartialConnectionInfo) => {
      try {
        const isNewConnection = !getConnectionInfoById(connectionInfo.id);
        const savedConnectionInfo = await saveConnection(connectionInfo);
        if (isNewConnection) {
          trackConnectionCreatedEvent(savedConnectionInfo, track);
        }
        return savedConnectionInfo;
      } catch (err) {
        debug(
          `error saving connection with id ${connectionInfo.id || ''}: ${
            (err as Error).message
          }`
        );

        openToast(`save-connection-error-${connectionInfo.id}`, {
          title: 'Error',
          variant: 'warning',
          description: `An error occurred while saving the connection. ${
            (err as Error).message
          }`,
        });

        return null;
      }
    },
    [openToast, saveConnection, getConnectionInfoById, track]
  );

  const oidcAttemptConnectNotifyDeviceAuth = useCallback(
    (
      connectionInfo: ConnectionInfo,
      {
        verificationUrl,
        userCode,
      }: { verificationUrl: string; userCode: string }
    ) => {
      dispatch({
        type: 'oidc-attempt-connect-notify-device-auth',
        connectionInfo,
        verificationUrl,
        userCode,
      });
    },
    []
  );

  const oidcUpdateSecrets = useCallback(
    async (connectionInfo: ConnectionInfo, dataService: DataService) => {
      try {
        if (!preferences.getPreferences().persistOIDCTokens) {
          return;
        }

        await saveConnectionInfo({
          id: connectionInfo.id,
          connectionOptions: await dataService.getUpdatedSecrets(),
        });
      } catch (err: any) {
        log.warn(
          mongoLogId(1_001_000_195),
          'Connection Store',
          'Failed to update connection store with updated secrets',
          { err: err?.stack }
        );
      }
    },
    [preferences, saveConnectionInfo]
  );

  const disconnect = useCallback(
    async (connectionId: string) => {
      debug('closing connection with connectionId', connectionId);
      // In case connection is in progress
      closeConnectionStatusToast(connectionId);
      log.info(
        mongoLogId(1_001_000_313),
        'Connection UI',
        'Initiating disconnect attempt'
      );
      try {
        await connectionsManager.closeConnection(connectionId);
        trackConnectionDisconnectedEvent(
          getConnectionInfoById(connectionId),
          track
        );
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
    },
    [
      closeConnectionStatusToast,
      connectionsManager,
      getConnectionInfoById,
      track,
    ]
  );

  const createNewConnection = useCallback(() => {
    dispatch({ type: 'new-connection' });
  }, []);

  const editConnection = useCallback(
    (connectionId: string) => {
      const connectionInfo = getConnectionInfoById(connectionId);
      if (connectionInfo) {
        dispatch({ type: 'edit-connection', connectionInfo });
      }
    },
    [getConnectionInfoById]
  );

  const cancelEditConnection = useCallback(() => {
    dispatch({ type: 'cancel-edit-connection' });
  }, []);

  const duplicateConnection = useCallback(
    async (
      connectionId: string,
      { autoDuplicate }: { autoDuplicate: boolean } = { autoDuplicate: false }
    ) => {
      const connectionInfo = getConnectionInfoById(connectionId);

      if (!connectionInfo) {
        return;
      }

      function parseFavoriteNameToNameAndCopyCount(
        favoriteName: string
      ): [string, number] {
        const { groups = {} } =
          favoriteName.match(/^(?<name>.+?)(\s\((?<count>\d+)\))?$/) ?? {};
        return [
          groups.name ?? favoriteName,
          groups.count ? Number(groups.count) : 0,
        ];
      }

      const duplicate: ConnectionInfo = {
        ...cloneDeep(connectionInfo),
        id: new UUID().toString(),
      };

      if (!duplicate.favorite) {
        duplicate.favorite = { name: getConnectionTitle(duplicate) };
      }

      const [nameWithoutCount, copyCount] = parseFavoriteNameToNameAndCopyCount(
        duplicate.favorite.name
      );

      const newCount = reduceConnectionInfo((topCount, connectionInfo) => {
        if (connectionInfo.favorite?.name) {
          const [name, count] = parseFavoriteNameToNameAndCopyCount(
            connectionInfo.favorite.name
          );
          if (name === nameWithoutCount && count >= topCount) {
            return count + 1;
          }
          return topCount;
        }
        return topCount;
      }, copyCount + 1);

      duplicate.favorite.name = `${nameWithoutCount} (${newCount})`;

      if (autoDuplicate) {
        await saveConnectionInfo(duplicate);
      }

      dispatch({
        type: 'duplicate-connection',
        connectionInfo: duplicate,
        autoDuplicate,
      });
    },
    [getConnectionInfoById, reduceConnectionInfo, saveConnectionInfo]
  );

  const removeConnection = useCallback(
    async (connectionId: string) => {
      const connectionInfo = getConnectionInfoById(connectionId);
      if (connectionInfo) {
        void disconnect(connectionId);
        await deleteConnection(connectionInfo);
        trackConnectionRemovedEvent(connectionInfo, track);
        dispatch({ type: 'delete-connection', connectionInfo });
      }
    },
    [deleteConnection, disconnect, getConnectionInfoById, track]
  );

  const removeAllRecentConnections = useCallback(async () => {
    await Promise.all(
      filterConnectionInfo((connectionInfo) => {
        return (
          !connectionInfo.savedConnectionType ||
          connectionInfo.savedConnectionType === 'recent'
        );
      }).map((connectionInfo) => {
        return removeConnection(connectionInfo.id);
      })
    );
  }, [filterConnectionInfo, removeConnection]);

  const saveEditedConnection = useCallback(
    async (connectionInfo: PartialConnectionInfo) => {
      const updatedConnectionInfo = await saveConnectionInfo(connectionInfo);
      dispatch({
        type: 'save-edited-connection',
        connectionInfo: updatedConnectionInfo,
      });
    },
    [saveConnectionInfo]
  );

  const toggleConnectionFavoritedStatus = useCallback(
    async (connectionId: string) => {
      const connectionInfo = getConnectionInfoById(connectionId);
      if (connectionInfo) {
        connectionInfo.savedConnectionType =
          connectionInfo.savedConnectionType === 'favorite'
            ? 'recent'
            : 'favorite';
        await saveConnectionInfo(connectionInfo);
      }
    },
    [getConnectionInfoById, saveConnectionInfo]
  );

  const showNonGenuineMongoDBWarningModal = useCallback(
    (connectionId: string) => {
      const connectionInfo = getConnectionInfoById(connectionId);
      track('Screen', { name: 'non_genuine_mongodb_modal' }, connectionInfo);
      void _showNonGenuineMongoDBWarningModal(connectionInfo);
    },
    [getConnectionInfoById, track]
  );

  const connect = useCallback(
    async (
      connectionInfoOrGetAutoconnectInfo:
        | ConnectionInfo
        | (() => Promise<ConnectionInfo | undefined>)
    ) => {
      const isAutoconnectAttempt =
        typeof connectionInfoOrGetAutoconnectInfo === 'function';

      let connectionInfo: ConnectionInfo | undefined;

      try {
        if (isAutoconnectAttempt) {
          log.info(
            mongoLogId(1_001_000_160),
            'Connection Store',
            'Performing automatic connection attempt'
          );
          const autoConnectInfo = await connectionInfoOrGetAutoconnectInfo();
          if (!autoConnectInfo) {
            return;
          }
          connectionInfo = autoConnectInfo;
        } else {
          connectionInfo = cloneDeep(connectionInfoOrGetAutoconnectInfo);
        }

        const {
          forceConnectionOptions,
          browserCommandForOIDCAuth,
          maximumNumberOfActiveConnections,
        } = preferences.getPreferences();

        if (
          typeof maximumNumberOfActiveConnections !== 'undefined' &&
          connectionsManager.getActiveConnectionsCount() >=
            maximumNumberOfActiveConnections
        ) {
          openMaximumConnectionsReachedToast(maximumNumberOfActiveConnections);
          return;
        }

        // We use connection storage directly for this check here because
        // connection repository state is React based and we have no means of
        // making sure that we already loaded connections when doing this check.
        // This should not be required after we remove the need to save the
        // connection before we actually connect (or at all) for the application
        // to function
        let existingConnectionInfo: ConnectionInfo | undefined;
        try {
          existingConnectionInfo = await connectionStorage.load({
            id: connectionInfo.id,
          });
        } catch {
          // Assume connection doesn't exist yet
        }

        // Auto-connect info should never be saved, connection storage has other
        // means to returning this info as part of the connections list for now
        if (!isAutoconnectAttempt) {
          if (
            // In single connection mode we only update existing connection when
            // we successfully connected. In multiple connections we don't care
            // if existing connection fails with errors and update it either way
            // before we finished connecting
            preferences.getPreferences().enableNewMultipleConnectionSystem ||
            // TODO(COMPASS-7397): The way the whole connection logic is set up
            // right now it is required that we save connection before starting
            // the connection process even if we don't need or want to so that
            // it can show up in the Compass UI and be picked up from connection
            // storage by various providers, this should not be required, but
            // we're preserving it for now to avoid even more refactoring
            !existingConnectionInfo
          ) {
            await saveConnectionInfo(connectionInfo);
          }
        }

        dispatch({
          type: 'attempt-connect',
          connectionInfo,
          isAutoConnect: isAutoconnectAttempt,
        });

        const connectionId = connectionInfo.id;

        openConnectionStartedToast(connectionInfo, () => {
          void disconnect(connectionId);
        });

        onConnectionAttemptStartedRef.current?.(connectionInfo);

        debug('connecting with connectionInfo', connectionInfo);

        log.info(
          mongoLogId(1_001_000_004),
          'Connection UI',
          'Initiating connection attempt',
          { isAutoconnectAttempt }
        );

        const dataService = await connectionsManager.connect(connectionInfo, {
          forceConnectionOptions,
          browserCommandForOIDCAuth,
          onDatabaseSecretsChange: (...args) => {
            void oidcUpdateSecrets(...args);
          },
          onNotifyOIDCDeviceFlow: oidcAttemptConnectNotifyDeviceAuth.bind(
            null,
            connectionInfo
          ),
        });

        try {
          const mergeConnectionInfo = preferences.getPreferences()
            .persistOIDCTokens
            ? { connectionOptions: await dataService.getUpdatedSecrets() }
            : {};

          // Auto-connect info should never be saved
          if (!isAutoconnectAttempt) {
            await saveConnectionInfo({
              ...merge(
                // In single connection mode we only update the last used
                // timestamp and maybe an OIDC token, everything else is kept
                // as-is so that "Connect" and "Save" are distinct features (as
                // the button labels in the connection form suggest). In
                // multiple connections we update everything
                preferences.getPreferences().enableNewMultipleConnectionSystem
                  ? connectionInfo
                  : // Existing connection info might be missing when connecting
                    // to a new connection for the first time
                    existingConnectionInfo ?? connectionInfo,
                mergeConnectionInfo
              ),
              lastUsed: new Date(),
            });
          }
        } catch (err) {
          debug(
            'failed to update connection info after successful connect',
            err
          );
        }

        dispatch({ type: 'connection-attempt-succeeded', connectionInfo });

        openConnectionSucceededToast(connectionInfo);

        void onConnectedRef.current?.(connectionInfo, dataService);

        debug(
          'connection attempt succeeded with connection info',
          connectionInfo
        );

        if (
          getGenuineMongoDB(connectionInfo.connectionOptions.connectionString)
            .isGenuine === false
        ) {
          void showNonGenuineMongoDBWarningModal(connectionInfo.id);
        }
      } catch (error) {
        const isConnectionCanceledError = isCancelError(error);

        log.error(
          mongoLogId(1_001_000_161),
          'Connection Store',
          'Error performing connection attempt',
          {
            error: (error as Error).message,
            isAutoconnectAttempt,
          }
        );

        if (!isConnectionCanceledError) {
          onConnectionFailedRef.current?.(
            connectionInfo ?? null,
            error as Error
          );

          openConnectionFailedToast(connectionInfo, error as Error, () => {
            if (connectionInfo) {
              editConnection(connectionInfo.id);
            }
          });
        }

        dispatch({
          type: 'connection-attempt-errored',
          error: error as Error,
          // Autoconnect flow might fail before we can even load connection info
          // so connectionInfo might be undefiend at this point. In single
          // connection mode this requires some special handling so that we can
          // error back to the connection editing form, so we create a new
          // connectionInfo if it's undefined
          connectionInfo: connectionInfo ?? createNewConnectionInfo(),
          isAutoConnect: isAutoconnectAttempt,
        });
      }
    },
    [
      connectionStorage,
      connectionsManager,
      disconnect,
      editConnection,
      oidcAttemptConnectNotifyDeviceAuth,
      oidcUpdateSecrets,
      onConnectedRef,
      onConnectionAttemptStartedRef,
      onConnectionFailedRef,
      openConnectionFailedToast,
      openConnectionStartedToast,
      openConnectionSucceededToast,
      openMaximumConnectionsReachedToast,
      preferences,
      saveConnectionInfo,
      showNonGenuineMongoDBWarningModal,
    ]
  );

  const connectRef = useCurrentRef(connect);

  useEffect(() => {
    if (connectionStorage.getAutoConnectInfo) {
      void connectRef.current(
        connectionStorage.getAutoConnectInfo.bind(connectionStorage)
      );
    }
  }, [connectRef, connectionStorage]);

  const connectWithInflightCheck = useCallback(
    async (connectionInfo: ConnectionInfo) => {
      const inflightConnect = InFlightConnections.get(connectionInfo.id);
      if (inflightConnect) {
        return inflightConnect;
      }
      try {
        const connectPromise = connectRef.current(connectionInfo);
        InFlightConnections.set(connectionInfo.id, connectPromise);
        return await connectPromise;
      } finally {
        InFlightConnections.delete(connectionInfo.id);
      }
    },
    [connectRef]
  );

  return {
    state,
    connect: connectWithInflightCheck,
    disconnect,
    createNewConnection,
    editConnection,
    saveEditedConnection,
    cancelEditConnection,
    duplicateConnection,
    toggleConnectionFavoritedStatus,
    removeConnection,
    removeAllRecentConnections,
    showNonGenuineMongoDBWarningModal,
    favoriteConnections,
    recentConnections,
  };
}
