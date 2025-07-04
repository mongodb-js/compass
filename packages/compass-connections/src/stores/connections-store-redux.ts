import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { Reducer, AnyAction, Action } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { ServerHeartbeatFailedEvent } from 'mongodb';
import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import type { ConnectionStorage } from '@mongodb-js/connection-storage/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type {
  connect as devtoolsConnect,
  ConnectionAttempt,
  ConnectionOptions,
  DataService,
} from 'mongodb-data-service';
import { createConnectionAttempt } from 'mongodb-data-service';
import { UUID } from 'bson';
import { assign, cloneDeep, isEqual, merge } from 'lodash';
import {
  proxyPreferenceToProxyOptions,
  type PreferencesAccess,
} from 'compass-preferences-model/provider';
import { getNotificationTriggers } from '../components/connection-status-notifications';
import { openToast, showConfirmation } from '@mongodb-js/compass-components';
import { adjustConnectionOptionsBeforeConnect } from '@mongodb-js/connection-form';
import mongodbBuildInfo, { getGenuineMongoDB } from 'mongodb-build-info';
import EventEmitter from 'events';
import { showNonGenuineMongoDBWarningModal as _showNonGenuineMongoDBWarningModal } from '../components/non-genuine-connection-modal';
import { showEndOfLifeMongoDBWarningModal as _showEndOfLifeMongoDBWarningModal } from '../components/end-of-life-connection-modal';
import ConnectionString from 'mongodb-connection-string-url';
import type { ExtraConnectionData as ExtraConnectionDataForTelemetry } from '@mongodb-js/compass-telemetry';
import { connectable } from '../utils/connection-supports';
import {
  getLatestEndOfLifeServerVersion,
  isEndOfLifeVersion,
} from '../utils/end-of-life-server';
import type { ImportConnectionOptions } from '@mongodb-js/connection-storage/provider';

export type ConnectionsEventMap = {
  connected: (
    connectionId: ConnectionId,
    connectionInfo: ConnectionInfo
  ) => void;
  disconnected: (
    connectionId: ConnectionId,
    connectionInfo: ConnectionInfo
  ) => void;
};

/**
 * Returns status of the autoconnect connection preserved for the duration of
 * the session. If connection was ever disconnected, this value will be used to
 * not connect again
 */
export function getSessionConnectionStatus(connectionId = '-1') {
  try {
    return window.sessionStorage.getItem(`CONNECTION_STATUS:${connectionId}`);
  } catch {
    return null;
  }
}

/**
 * Allows to store connection status for the duration of the current session
 * (while the browser tab / window exists). Useful to preserve
 * connection state between page reloads. Currently only used by Compass desktop
 * to prevent autoconnecting to trigger on hard page refresh.
 */
export function setSessionConnectionStatus(
  connectionId: string,
  status: 'disconnected'
) {
  try {
    return window.sessionStorage.setItem(
      `CONNECTION_STATUS:${connectionId}`,
      status
    );
  } catch {
    return false;
  }
}

export interface ConnectionsEventEmitter {
  emit<K extends keyof ConnectionsEventMap>(
    this: void,
    event: K,
    ...args: Parameters<ConnectionsEventMap[K]>
  ): boolean;
  on<K extends keyof ConnectionsEventMap>(
    this: void,
    event: K,
    listener: ConnectionsEventMap[K]
  ): ConnectionsEventEmitter;
  off<K extends keyof ConnectionsEventMap>(
    this: void,
    event: K,
    listener: ConnectionsEventMap[K]
  ): ConnectionsEventEmitter;
  removeListener<K extends keyof ConnectionsEventMap>(
    this: void,
    event: K,
    listener: ConnectionsEventMap[K]
  ): ConnectionsEventEmitter;
  once<K extends keyof ConnectionsEventMap>(
    this: void,
    event: K,
    listener: ConnectionsEventMap[K]
  ): ConnectionsEventEmitter;
}

const emitter = new EventEmitter();

export const connectionsEventEmitter: ConnectionsEventEmitter = {
  emit: (event, ...args) => {
    try {
      return emitter.emit(event, ...args);
    } catch {
      return false;
    }
  },
  on: (event, listener) => {
    emitter.on(event, listener);
    return connectionsEventEmitter;
  },
  off: (event, listener) => {
    emitter.on(event, listener);
    return connectionsEventEmitter;
  },
  removeListener: (event, listener) => {
    emitter.on(event, listener);
    return connectionsEventEmitter;
  },
  once: (event, listener) => {
    emitter.on(event, listener);
    return connectionsEventEmitter;
  },
};

export type ConnectionState = {
  info: ConnectionInfo;
  /**
   * This flag will be true when connection is just being created: during
   * duplication or "new connection" creation. We keep this value in state so
   * that the connection can be hidden from the sidebar until you start
   * connecting or save it
   */
  isBeingCreated?: boolean;
  /**
   * Flag set on the info that was resolved when compass is autoconnecting,
   * can't be edited or saved
   */
  isAutoconnectInfo?: boolean;
} & (
  | {
      status:
        | 'initial'
        | 'connecting'
        | 'connected'
        | 'disconnected'
        | 'canceled';
      error: null;
    }
  | { status: 'failed'; error: Error }
);

export type ConnectionId = ConnectionInfo['id'];

/**
 * Connections list stored following Redux data normalization guidelines
 * @see {@link https://redux.js.org/usage/structuring-reducers/normalizing-state-shape#designing-a-normalized-state}
 */
type NormalizedConnectionsList = {
  ids: ConnectionId[];
  byId: Record<ConnectionId, ConnectionState>;
};

export type State = {
  // State of all connections currently known to the application state.
  // Populated from the connection storage initially, but also keeps reference
  // to all non-stored connections in the app, like autoconnect info or
  // connections being edited before they are saved
  connections: NormalizedConnectionsList &
    (
      | {
          status: 'initial' | 'ready';
          error: null;
        }
      | { status: 'loading' | 'refreshing'; error: Error | null }
      | { status: 'error'; error: Error }
    );

  editingConnectionInfoId: ConnectionId | null;
  isEditingConnectionInfoModalOpen: boolean;
};

type ThunkExtraArg = {
  appName: string;
  preferences: PreferencesAccess;
  connectionStorage: ConnectionStorage;
  track: TrackFunction;
  logger: Logger;
  getExtraConnectionData: (
    connectionInfo: ConnectionInfo
  ) => Promise<[ExtraConnectionDataForTelemetry, string | null]>;
  connectFn?: typeof devtoolsConnect;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  onFailToLoadConnections: (error: Error) => void;
};

export type ConnectionsThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<R, State, ThunkExtraArg, A>;

export const enum ActionTypes {
  // Actions related to getting connections from the persistent store (like disk
  // or cloud backend)
  ConnectionsLoadStart = 'ConnectionsLoadStart',
  ConnectionsLoadSuccess = 'ConnectionsLoadSuccess',
  ConnectionsLoadError = 'ConnectionsLoadError',

  ConnectionsRefreshStart = 'ConnectionsRefreshStart',
  ConnectionsRefreshSuccess = 'ConnectionsRefreshSuccess',
  ConnectionsRefreshError = 'ConnectionsRefreshError',

  // Desktop-only connections import feature
  ConnectionsImportParsingStart = 'ConnectionsImportParsingStart',
  ConnectionsImportParsingFinish = 'ConnectionsImportParsingFinish',
  ConnectionsImportStart = 'ConnectionsImportStart',
  ConnectionsImportFinish = 'ConnectionsImportFinish',

  // Desktop-only connections export feature
  ConnectionsExportStart = 'ConnectionsExportStart',
  ConnectionsExportFinish = 'ConnectionsExportFinish',

  // Checking for the need to autoconnect on application start
  ConnectionAutoconnectCheck = 'ConnectionAutoconnectCheck',

  // Connection attempt related actions. Connection attempt can be triggered by
  // user actions or autoconnect
  ConnectionAttemptStart = 'ConnectionAttemptStart',
  ConnectionAttemptSuccess = 'ConnectionAttemptSuccess',
  ConnectionAttemptError = 'ConnectionAttemptError',
  ConnectionAttemptCancelled = 'ConnectionAttemptCancelled',
  // During the connection attempt process if OIDC auth flow requires manually
  // entering a device code on the external website. Only required for single
  // connection mode and can be removed afterwards
  OidcNotifyDeviceAuth = 'OidcNotifyDeviceAuth',
  Disconnect = 'Disconnect',

  // Actions related to modifying connection info

  // Anything that is triggered by the user from the UI through action buttons
  // and connection editing form
  CreateNewConnection = 'CreateNewConnection',
  DuplicateConnection = 'DuplicateConnection',
  EditConnection = 'EditConnection',
  // Opens a special favorite editing modal form. Only applicable for single
  // connection mode where the special form is accessible
  EditConnectionFavoriteInfo = 'EditConnectionFavoriteInfo',
  ToggleFavoriteConnection = 'ToggleFavoriteConnection',
  CancelEditConnection = 'CancelEditConnection',
  SaveEditedConnection = 'SaveEditedConnection',
  // When connection info is actually updated in storage. Can be a result of
  // events above, or implicitly triggered by the application flow: for example
  // when secrets are changed and we want to store the updated ones
  SaveConnectionInfo = 'SaveConnectionInfo',
  RemoveConnection = 'RemoveConnection',
  RemoveAllRecentConnections = 'RemoveAllRecentConnections',
}

type ConnectionsLoadStartAction = {
  type: ActionTypes.ConnectionsLoadStart;
};

type ConnectionsLoadSuccessAction = {
  type: ActionTypes.ConnectionsLoadSuccess;
  connections: ConnectionInfo[];
};

type ConnectionsLoadErrorAction = {
  type: ActionTypes.ConnectionsLoadError;
  error: Error;
};

type ConnectionsRefreshStartAction = {
  type: ActionTypes.ConnectionsRefreshStart;
};

type ConnectionsRefreshSuccessAction = {
  type: ActionTypes.ConnectionsRefreshSuccess;
  connections: ConnectionInfo[];
};

type ConnectionsRefreshErrorAction = {
  type: ActionTypes.ConnectionsRefreshError;
  error: Error;
};

// TODO: move all import / export actions to connections store

// type ConnectionsImportParsingStartAction = {
//   type: ActionTypes.ConnectionsImportParsingStart;
// };

// type ConnectionsImportParsingFinishAction = {
//   type: ActionTypes.ConnectionsImportParsingFinish;
//   connections: ConnectionInfo[];
// };

type ConnectionsImportStartAction = {
  type: ActionTypes.ConnectionsImportStart;
};

type ConnectionsImportFinishAction = {
  type: ActionTypes.ConnectionsImportFinish;
  connections: ConnectionInfo[];
};

// type ConnectionsExportStartAction = {
//   type: ActionTypes.ConnectionsExportStart;
// };

// type ConnectionsExportFinishAction = {
//   type: ActionTypes.ConnectionsExportFinish;
// };

type ConnectionAutoconnectCheckAction = {
  type: ActionTypes.ConnectionAutoconnectCheck;
  connectionInfo: ConnectionInfo | undefined;
};

type ConnectionAttemptStartAction = {
  type: ActionTypes.ConnectionAttemptStart;
  connectionInfo: ConnectionInfo;
  options: {
    forceSave: boolean;
  };
};

type ConnectionAttemptSuccessAction = {
  type: ActionTypes.ConnectionAttemptSuccess;
  connectionId: ConnectionId;
};

type ConnectionAttemptErrorAction = {
  type: ActionTypes.ConnectionAttemptError;
  connectionId: ConnectionId | null;
  error: Error;
};

type ConnectionAttemptCancelledAction = {
  type: ActionTypes.ConnectionAttemptCancelled;
  connectionId: ConnectionId;
};

type DisconnectAction = {
  type: ActionTypes.Disconnect;
  connectionId: ConnectionId;
};

type CreateNewConnectionAction = {
  type: ActionTypes.CreateNewConnection;
};

type DuplicateConnectionAction = {
  type: ActionTypes.DuplicateConnection;
  duplicateInfo: ConnectionInfo;
  isAutoDuplicate: boolean;
};

type EditConnectionAction = {
  type: ActionTypes.EditConnection;
  connectionId: ConnectionId;
};

type ToggleFavoriteConnectionAction = {
  type: ActionTypes.ToggleFavoriteConnection;
  connectionId: ConnectionId;
};

type CancelEditConnectionAction = {
  type: ActionTypes.CancelEditConnection;
  connectionId: ConnectionId;
};

type SaveEditedConnectionAction = {
  type: ActionTypes.SaveEditedConnection;
  connectionId: ConnectionId;
};

type SaveConnectionInfoAction = {
  type: ActionTypes.SaveConnectionInfo;
  connectionInfo: ConnectionInfo;
};

type RemoveConnectionAction = {
  type: ActionTypes.RemoveConnection;
  connectionId: ConnectionId;
};

type RemoveAllRecentConnectionsActions = {
  type: ActionTypes.RemoveAllRecentConnections;
};

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

const InFlightConnections = new Map<ConnectionId, PromiseLike<void>>();

const ConnectionAttemptForConnection = new Map<
  ConnectionId,
  ConnectionAttempt
>();

const DataServiceForConnection = new Map<ConnectionId, DataService>();

export function getDataServiceForConnection(connectionId: ConnectionId) {
  const ds = DataServiceForConnection.get(connectionId);
  if (!ds) {
    throw new Error(
      `Failed to locate DataService instance for connection ${connectionId}`
    );
  }
  return ds;
}

/**
 * Connection secrets are stored in-memory even after disconnecting (even if
 * storing secrets to persistent store is disabled). That was when re-connecting
 * to connections with secrets inside the same session, we make it a bit easier
 */
const SecretsForConnection = new Map<
  ConnectionId,
  Partial<ConnectionOptions>
>();

export function createDefaultConnectionInfo() {
  return {
    id: new UUID().toString(),
    connectionOptions: {
      // NB: it is imperative that this value stays in sync with the one used in
      // connection-form package, otherwise it breaks some form behavior
      connectionString: 'mongodb://localhost:27017',
    },
  };
}

export function createDefaultConnectionState(
  connectionInfo: ConnectionInfo = createDefaultConnectionInfo()
): ConnectionState {
  return {
    info: connectionInfo,
    status: 'initial',
    error: null,
  };
}

const INITIAL_STATE: State = {
  connections: {
    ids: [],
    byId: {},
    status: 'initial',
    error: null,
  },
  editingConnectionInfoId: null,
  isEditingConnectionInfoModalOpen: false,
};

export function getInitialConnectionsStateForConnectionInfos(
  connectionInfos?: ConnectionInfo[]
): State['connections'] {
  if (!connectionInfos) {
    // Keep initial state if we're not preloading any connections
    return {
      byId: {},
      ids: [],
      status: 'initial',
      error: null,
    };
  }
  const byId = Object.fromEntries<ConnectionState>(
    connectionInfos.map((info) => {
      return [info.id, createDefaultConnectionState(info)];
    })
  );
  return {
    byId,
    ids: getSortedIdsForConnections(Object.values(byId)),
    status: 'ready',
    error: null,
  };
}

function savedTypeCompare(a: ConnectionInfo, b: ConnectionInfo) {
  const isFavA = a.savedConnectionType === 'favorite';
  const isFavB = b.savedConnectionType === 'favorite';
  return isFavA === isFavB ? 0 : isFavA && !isFavB ? -1 : 1;
}

function getSortedIdsForConnections(
  connections: ConnectionState[]
): ConnectionId[] {
  return connections
    .slice()
    .sort((a, b) => {
      const aTitle = getConnectionTitle(a.info).toLocaleLowerCase();
      const bTitle = getConnectionTitle(b.info).toLocaleLowerCase();
      return (
        // Favorites are always first
        savedTypeCompare(a.info, b.info) ||
        // Then compare by title
        aTitle.localeCompare(bTitle) ||
        // If titles are the same, compare the ids just to make sure that the
        // sorting is stable no matter what's the input initial order was
        a.info.id.localeCompare(b.info.id)
      );
    })
    .map((connectionState) => {
      return connectionState.info.id;
    });
}

function mergeConnections(
  connectionsState: State['connections'],
  newConnections: ConnectionInfo | ConnectionInfo[]
): State['connections'] {
  newConnections = Array.isArray(newConnections)
    ? newConnections
    : [newConnections];

  const removedConnectionIds = new Set(connectionsState.ids);

  let newConnectionsById = connectionsState.byId;

  for (const connectionInfo of newConnections) {
    removedConnectionIds.delete(connectionInfo.id);
    const existingConnection = newConnectionsById[connectionInfo.id];

    // If we got a new connection, just create a default state for this
    // connection and update new connections by id
    if (!existingConnection) {
      newConnectionsById = {
        ...newConnectionsById,
        [connectionInfo.id]: createDefaultConnectionState(connectionInfo),
      };
    }

    // If connection already exists, only update the info if new connection info
    // is different
    if (
      existingConnection &&
      !isEqual(existingConnection.info, connectionInfo)
    ) {
      newConnectionsById = {
        ...newConnectionsById,
        [connectionInfo.id]: {
          ...existingConnection,
          info: connectionInfo,
        },
      };

      // TODO(COMPASS-9319): if an Atlas connection is going from PAUSED state to unpaused, we should
      // reconnect the data service, since it would previously have been disconnected
      // due to non-retryable error code.
    }
  }

  // If an Atlas connection was removed, it means that the cluster was deleted
  for (const connectionId of removedConnectionIds) {
    const removedConnection = newConnectionsById[connectionId];
    if (removedConnection.info.atlasMetadata) {
      newConnectionsById = {
        ...newConnectionsById,
        [connectionId]: {
          ...removedConnection,
          info: {
            ...removedConnection.info,
            atlasMetadata: {
              ...removedConnection.info.atlasMetadata,
              clusterState: 'DELETED',
            },
          },
        },
      };
    }
  }

  // If we haven't modified newConnectionsById at this point, we can stop: none
  // of the new connections are different from what we have in the state already
  if (newConnectionsById === connectionsState.byId) {
    return connectionsState;
  }

  const newIds = getSortedIdsForConnections(Object.values(newConnectionsById));

  return {
    ...connectionsState,
    byId: newConnectionsById,
    // In cases where some data irrelevant for the sorting information was
    // changed, it is possible for ids to stay the same even if info was
    // updated. If ids didn't change, return previous state
    ids: isEqual(connectionsState.ids, newIds) ? connectionsState.ids : newIds,
  };
}

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
    ? RecursivePartial<T[P]>
    : T[P];
};

function mergeConnectionStateById(
  connections: State['connections'],
  connectionId: ConnectionId,
  connectionState: RecursivePartial<ConnectionState>,
  { shallowMerge = false }: { shallowMerge?: boolean } = {}
): State['connections'] {
  const existingConnectionState = connections.byId[connectionId];
  const mergeFn = shallowMerge ? assign : merge;

  const newConnectionState = mergeFn(
    existingConnectionState
      ? cloneDeep(existingConnectionState)
      : createDefaultConnectionState(),
    connectionState
  );

  if (
    existingConnectionState &&
    isEqual(existingConnectionState, newConnectionState)
  ) {
    return connections;
  }

  const newConnectionsById = {
    ...connections.byId,
    [newConnectionState.info.id]: newConnectionState,
  };

  const newIds = getSortedIdsForConnections(Object.values(newConnectionsById));

  return {
    ...connections,
    byId: newConnectionsById,
    ids: isEqual(newIds, connections.ids) ? connections.ids : newIds,
  };
}

function createConnectionInfoDuplicate(
  connectionInfo: ConnectionInfo,
  existingConnections: ConnectionInfo[]
): ConnectionInfo {
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

  if (!duplicate.favorite || !duplicate.favorite.name) {
    duplicate.favorite = {
      ...duplicate.favorite,
      name: getConnectionTitle(duplicate),
    };
  }

  const [nameWithoutCount, copyCount] = parseFavoriteNameToNameAndCopyCount(
    duplicate.favorite.name
  );

  const newCount = existingConnections.reduce((topCount, connectionInfo) => {
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

  delete duplicate.lastUsed;

  return duplicate;
}

function hasConnectionForId(state: State, connectionId: ConnectionId): boolean {
  return !!state.connections.byId[connectionId];
}

const reducer: Reducer<State, Action> = (state = INITIAL_STATE, action) => {
  if (
    isAction<ConnectionsLoadStartAction>(
      action,
      ActionTypes.ConnectionsLoadStart
    )
  ) {
    return {
      ...state,
      connections: {
        ...state.connections,
        status: 'loading',
      },
    };
  }
  if (
    isAction<ConnectionsLoadSuccessAction>(
      action,
      ActionTypes.ConnectionsLoadSuccess
    )
  ) {
    return {
      ...state,
      connections: {
        ...mergeConnections(state.connections, action.connections),
        status: 'ready',
        error: null,
      },
    };
  }
  if (
    isAction<ConnectionsLoadErrorAction>(
      action,
      ActionTypes.ConnectionsLoadError
    )
  ) {
    return {
      ...state,
      connections: {
        ...state.connections,
        status: 'error',
        error: action.error,
      },
    };
  }
  if (
    isAction<ConnectionsRefreshStartAction>(
      action,
      ActionTypes.ConnectionsRefreshStart
    )
  ) {
    return {
      ...state,
      connections: {
        ...state.connections,
        status: 'refreshing',
      },
    };
  }
  if (
    isAction<ConnectionsRefreshSuccessAction>(
      action,
      ActionTypes.ConnectionsRefreshSuccess
    )
  ) {
    return {
      ...state,
      connections: {
        ...mergeConnections(state.connections, action.connections),
        status: 'ready',
        error: null,
      },
    };
  }
  if (
    isAction<ConnectionsRefreshErrorAction>(
      action,
      ActionTypes.ConnectionsRefreshError
    )
  ) {
    return {
      ...state,
      connections: {
        ...state.connections,
        status: 'error',
        error: action.error,
      },
    };
  }
  if (
    isAction<ConnectionsImportFinishAction>(
      action,
      ActionTypes.ConnectionsImportFinish
    )
  ) {
    return {
      ...state,
      connections: mergeConnections(state.connections, action.connections),
    };
  }
  if (
    isAction<ConnectionAutoconnectCheckAction>(
      action,
      ActionTypes.ConnectionAutoconnectCheck
    )
  ) {
    if (!action.connectionInfo) {
      return state;
    }

    const connectionState = createDefaultConnectionState(action.connectionInfo);

    return {
      ...state,
      connections: mergeConnectionStateById(
        state.connections,
        connectionState.info.id,
        {
          ...connectionState,
          isAutoconnectInfo: true,
        }
      ),
    };
  }
  if (
    isAction<ConnectionAttemptStartAction>(
      action,
      ActionTypes.ConnectionAttemptStart
    )
  ) {
    return {
      ...state,
      connections: mergeConnectionStateById(
        state.connections,
        action.connectionInfo.id,
        {
          ...(isNewConnection(state, action.connectionInfo.id) ||
          action.options.forceSave
            ? {
                // For new connections or when we're forcing a
                // save (the Save & Connect button), update the state with new
                // info right away (we will also save it to the storage at the
                // end)
                info: action.connectionInfo,
              }
            : {
                info: {
                  // For existing connections only update favorite info when
                  // connection starts. That way it immediately updates in UI
                  // and then also gets saved at the end of successfull
                  // connection
                  favorite: action.connectionInfo.favorite,
                  savedConnectionType:
                    action.connectionInfo.savedConnectionType,
                },
              }),
          status: 'connecting',
          error: null,
        }
      ),
      isEditingConnectionInfoModalOpen:
        // Close the modal when connection starts for edited connection
        state.editingConnectionInfoId === action.connectionInfo.id
          ? false
          : state.isEditingConnectionInfoModalOpen,
    };
  }
  if (
    isAction<ConnectionAttemptSuccessAction>(
      action,
      ActionTypes.ConnectionAttemptSuccess
    )
  ) {
    return {
      ...state,
      connections: mergeConnectionStateById(
        state.connections,
        action.connectionId,
        {
          isBeingCreated: false,
          status: 'connected',
          error: null,
        }
      ),
    };
  }
  if (
    isAction<ConnectionAttemptErrorAction>(
      action,
      ActionTypes.ConnectionAttemptError
    )
  ) {
    let connectionState = action.connectionId
      ? state.connections.byId[action.connectionId]
      : null;

    // Special autoconnect case for single connection: if autoconnection failed
    // before we even managed to load connection info, we won't have a
    // connection state to map the error to. It's not an issue for multiple
    // connections because the connection form is not always on the screen, but
    // in single connection mode we need some connection info to map the error
    // to, so we create one and add it to the connection list
    if (!connectionState) {
      connectionState = createDefaultConnectionState();
      connectionState.isAutoconnectInfo = true;
    }

    return {
      ...state,
      connections: mergeConnectionStateById(
        state.connections,
        connectionState.info.id,
        {
          ...connectionState,
          isBeingCreated: false,
          status: 'failed',
          error: action.error,
        }
      ),
      editingConnectionInfoId: connectionState.info.id,
    };
  }
  if (isAction<DisconnectAction>(action, ActionTypes.Disconnect)) {
    return {
      ...state,
      connections: mergeConnectionStateById(
        state.connections,
        action.connectionId,
        { status: 'disconnected' }
      ),
    };
  }
  if (
    isAction<CreateNewConnectionAction>(action, ActionTypes.CreateNewConnection)
  ) {
    const newConnection = createDefaultConnectionState();
    newConnection.isBeingCreated = true;

    return {
      ...state,
      connections: mergeConnectionStateById(
        state.connections,
        newConnection.info.id,
        newConnection
      ),
      editingConnectionInfoId: newConnection.info.id,
      isEditingConnectionInfoModalOpen: true,
    };
  }
  if (
    isAction<DuplicateConnectionAction>(action, ActionTypes.DuplicateConnection)
  ) {
    return {
      ...state,
      connections: mergeConnectionStateById(
        state.connections,
        action.duplicateInfo.id,
        {
          info: action.duplicateInfo,
          isBeingCreated: !action.isAutoDuplicate,
        }
      ),
      editingConnectionInfoId: action.duplicateInfo.id,
      ...(!action.isAutoDuplicate && {
        isEditingConnectionInfoModalOpen: true,
      }),
    };
  }
  if (isAction<EditConnectionAction>(action, ActionTypes.EditConnection)) {
    if (!hasConnectionForId(state, action.connectionId)) {
      return state;
    }

    return {
      ...state,
      editingConnectionInfoId: action.connectionId,
      isEditingConnectionInfoModalOpen: true,
    };
  }
  if (
    isAction<ToggleFavoriteConnectionAction>(
      action,
      ActionTypes.ToggleFavoriteConnection
    )
  ) {
    return {
      ...state,
      connections: mergeConnectionStateById(
        state.connections,
        action.connectionId,
        {
          info: {
            savedConnectionType:
              state.connections.byId[action.connectionId].info
                .savedConnectionType === 'favorite'
                ? 'recent'
                : 'favorite',
          },
        }
      ),
    };
  }
  if (
    isAction<CancelEditConnectionAction>(
      action,
      ActionTypes.CancelEditConnection
    )
  ) {
    if (!hasConnectionForId(state, action.connectionId)) {
      return state;
    }

    let connections = state.connections;
    const editingConnectionInfoId = state.editingConnectionInfoId;

    // In cases where connection was never saved or used before, we remove it
    // from the connections state
    if (state.connections.byId[action.connectionId].isBeingCreated) {
      const newConnectionsById = { ...state.connections.byId };
      delete newConnectionsById[action.connectionId];

      const newIds = connections.ids.filter((id) => {
        return id !== action.connectionId;
      });

      connections = {
        ...connections,
        byId: newConnectionsById,
        ids: newIds,
      };
    }

    return {
      ...state,
      connections,
      editingConnectionInfoId,
      ...(state.editingConnectionInfoId === action.connectionId && {
        isEditingConnectionInfoModalOpen: false,
      }),
    };
  }
  if (
    isAction<SaveEditedConnectionAction>(
      action,
      ActionTypes.SaveEditedConnection
    )
  ) {
    if (!hasConnectionForId(state, action.connectionId)) {
      return state;
    }

    return {
      ...state,
      ...(state.editingConnectionInfoId === action.connectionId && {
        isEditingConnectionInfoModalOpen: false,
      }),
    };
  }
  if (
    isAction<SaveConnectionInfoAction>(action, ActionTypes.SaveConnectionInfo)
  ) {
    if (!hasConnectionForId(state, action.connectionInfo.id)) {
      return state;
    }

    return {
      ...state,
      connections: mergeConnectionStateById(
        state.connections,
        action.connectionInfo.id,
        { info: action.connectionInfo, isBeingCreated: false },
        // Completely replace the connection info with the new one on save
        { shallowMerge: true }
      ),
    };
  }
  if (isAction<RemoveConnectionAction>(action, ActionTypes.RemoveConnection)) {
    if (!hasConnectionForId(state, action.connectionId)) {
      return state;
    }

    // Shallow cloning properties that we are going to change
    let newConnectionsState = {
      ...state.connections,
      byId: {
        ...state.connections.byId,
      },
    };
    delete newConnectionsState.byId[action.connectionId];

    const isEditingRemovedConnection =
      state.editingConnectionInfoId === action.connectionId;

    const newConnection = isEditingRemovedConnection
      ? createDefaultConnectionState()
      : undefined;

    // Special case for single connection: when deleting a connection that is
    // currently selected in the sidebar, we automatically create a new
    // connection and will "select" it for editing. Can go away when single
    // connection mode is removed
    if (newConnection) {
      newConnection.isBeingCreated = true;
      newConnectionsState = mergeConnectionStateById(
        newConnectionsState,
        newConnection.info.id,
        newConnection
      );
    } else {
      // Only in the else case because `mergeConnectionStateById` will already
      // filter it out
      newConnectionsState.ids = newConnectionsState.ids.filter((id) => {
        return id !== action.connectionId;
      });
    }

    return {
      ...state,
      connections: newConnectionsState,
      ...(isEditingRemovedConnection && {
        editingConnectionInfoId:
          newConnection?.info.id ?? state.editingConnectionInfoId,
        isEditingConnectionInfoModalOpen: false,
      }),
    };
  }
  if (
    isAction<RemoveAllRecentConnectionsActions>(
      action,
      ActionTypes.RemoveAllRecentConnections
    )
  ) {
    const idsToRemove = Object.values(state.connections.byId)
      .filter((connection) => {
        return isRecentConnection(connection);
      })
      .map((connection) => {
        return connection.info.id;
      });

    if (idsToRemove.length === 0) {
      return state;
    }

    // Shallow cloning properties that we are going to change
    let newConnectionsState = {
      ...state.connections,
      byId: {
        ...state.connections.byId,
      },
    };

    for (const id of idsToRemove) {
      delete newConnectionsState.byId[id];
    }

    const isEditingRemovedConnection =
      !!state.editingConnectionInfoId &&
      idsToRemove.some((id) => {
        return id === state.editingConnectionInfoId;
      });

    const newConnection = isEditingRemovedConnection
      ? createDefaultConnectionState()
      : undefined;

    // Special case for single connection: see RemoveConnectionAction reducer
    if (newConnection) {
      newConnection.isBeingCreated = true;
      newConnectionsState = mergeConnectionStateById(
        newConnectionsState,
        newConnection.info.id,
        newConnection
      );
    } else {
      newConnectionsState.ids = newConnectionsState.ids.filter((id) => {
        return !idsToRemove.includes(id);
      });
    }

    return {
      ...state,
      connections: newConnectionsState,
      ...(isEditingRemovedConnection && {
        editingConnectionInfoId:
          newConnection?.info.id ?? state.editingConnectionInfoId,
        isEditingConnectionInfoModalOpen: false,
      }),
    };
  }
  return state;
};

export const loadConnections = (): ConnectionsThunkAction<
  Promise<void>,
  | ConnectionsLoadStartAction
  | ConnectionsLoadSuccessAction
  | ConnectionsLoadErrorAction
> => {
  return async (
    dispatch,
    getState,
    { connectionStorage, onFailToLoadConnections }
  ) => {
    if (getState().connections.status !== 'initial') {
      return;
    }
    dispatch({ type: ActionTypes.ConnectionsLoadStart });
    try {
      const connections = await connectionStorage.loadAll();
      dispatch({ type: ActionTypes.ConnectionsLoadSuccess, connections });
    } catch (err) {
      dispatch({ type: ActionTypes.ConnectionsLoadError, error: err as any });
      onFailToLoadConnections(err as Error);
    }
  };
};

export const refreshConnections = (): ConnectionsThunkAction<
  Promise<void>,
  | ConnectionsRefreshStartAction
  | ConnectionsRefreshErrorAction
  | ConnectionsRefreshSuccessAction
> => {
  return async (dispatch, getState, { connectionStorage }) => {
    if (
      getState().connections.status !== 'ready' &&
      getState().connections.status !== 'error'
    ) {
      return;
    }
    dispatch({ type: ActionTypes.ConnectionsRefreshStart });
    try {
      const connections = await connectionStorage.loadAll();
      dispatch({ type: ActionTypes.ConnectionsRefreshSuccess, connections });
    } catch (err) {
      dispatch({
        type: ActionTypes.ConnectionsRefreshError,
        error: err as any,
      });
    }
  };
};

const connectionAttemptError = (
  connectionInfo: ConnectionInfo | null,
  err: any
): ConnectionsThunkAction<void, ConnectionAttemptErrorAction> => {
  return (dispatch, _getState, { track, getExtraConnectionData }) => {
    const { openConnectionFailedToast } = getNotificationTriggers();

    const showReviewButton = !!connectionInfo && !connectionInfo.atlasMetadata;

    openConnectionFailedToast(connectionInfo, err, showReviewButton, () => {
      if (connectionInfo) {
        dispatch(editConnection(connectionInfo.id));
      }
    });

    track(
      'Connection Failed',
      async () => {
        const trackParams = {
          error_code: err.code,
          error_name: err.codeName ?? err.name,
        };
        if (connectionInfo) {
          const [extraInfo] = await getExtraConnectionData(connectionInfo);
          Object.assign(trackParams, extraInfo);
        }
        return trackParams;
      },
      connectionInfo ?? undefined
    );

    dispatch({
      type: ActionTypes.ConnectionAttemptError,
      connectionId: connectionInfo?.id ?? null,
      error: err,
    });
  };
};

export const autoconnectCheck = (
  getAutoconnectInfo: (
    connectionStorage: ConnectionStorage
  ) => Promise<ConnectionInfo | undefined>,
  doNotReconnectDisconnectedAutoconnectInfo = false
): ConnectionsThunkAction<
  Promise<void>,
  ConnectionAutoconnectCheckAction | ConnectionAttemptErrorAction
> => {
  return async (
    dispatch,
    _getState,
    { logger: { log, mongoLogId }, connectionStorage }
  ) => {
    try {
      log.info(
        mongoLogId(1_001_000_160),
        'Connection Store',
        'Performing automatic connection attempt'
      );
      const connectionInfo = await getAutoconnectInfo(connectionStorage);
      if (
        doNotReconnectDisconnectedAutoconnectInfo &&
        getSessionConnectionStatus(connectionInfo?.id) === 'disconnected'
      ) {
        return;
      }
      dispatch({
        type: ActionTypes.ConnectionAutoconnectCheck,
        connectionInfo: connectionInfo,
      });
      if (connectionInfo) {
        void dispatch(connect(connectionInfo));
      }
    } catch (err) {
      dispatch(connectionAttemptError(null, err));
    }
  };
};

function isAutoconnectInfo(state: State, connectionId: ConnectionId) {
  return (
    state.connections.byId[connectionId] &&
    !!state.connections.byId[connectionId].isAutoconnectInfo
  );
}

/**
 * New connection is connection that is in the process of being created and was
 * never saved or connected to before. Indicated by `isBeingCreated` state of
 * the connection or just completely missing from the current state
 */
function isNewConnection(state: State, connectionId: ConnectionId) {
  return (
    !state.connections.byId[connectionId] ||
    !!state.connections.byId[connectionId].isBeingCreated
  );
}

function getCurrentConnectionInfo(
  state: State,
  connectionId: ConnectionId
): ConnectionInfo | undefined {
  return state.connections.byId[connectionId]?.info;
}

function getCurrentConnectionStatus(state: State, connectionId: ConnectionId) {
  return state.connections.byId[connectionId]?.status;
}

/**
 * Returns the number of active connections. We count in-progress connections
 * as "active" to make sure that the maximum connection allowed check takes
 * those into account and doesn't allow to open more connections than allowed
 * by starting too many connections in parallel
 */
function getActiveConnectionsCount(connections: State['connections']) {
  return Object.values(connections.byId).filter((connectionState) => {
    return ['connected', 'connecting'].includes(connectionState.status);
  }).length;
}

async function showOIDCReauthModal(connectionInfo: ConnectionInfo) {
  const confirmed = await showConfirmation({
    title: `Authentication expired for ${getConnectionTitle(connectionInfo)}`,
    description:
      'You need to re-authenticate to the database in order to continue.',
  });
  if (!confirmed) {
    throw new Error('Reauthentication declined by user');
  }
}

function isAtlasStreamsInstance(
  adjustedConnectionInfoForConnection: ConnectionInfo
) {
  try {
    return mongodbBuildInfo.isAtlasStream(
      adjustedConnectionInfoForConnection.connectionOptions.connectionString
    );
  } catch {
    // This catch-all is not ideal, but it safe-guards regular connections
    // instead of making assumptions on the fact that the implementation
    // of `mongodbBuildInfo.isAtlasStream` would never throw.
    return false;
  }
}

// We listen for non-retry-able errors on failed server heartbeats.
// These can happen on compass web when:
// - A user's session has ended.
// - The user's roles have changed.
// - The cluster / group they are trying to connect to has since been deleted.
// When we encounter one we disconnect. This is to avoid polluting logs/metrics
// and to avoid constantly retrying to connect when we know it'll fail.
// These error codes can be found at
// https://github.com/10gen/mms/blob/de2a9c463cfe530efb8e2a0941033e8207b6cb11/server/src/main/com/xgen/cloud/services/clusterconnection/runtime/res/CustomCloseCodes.java
const NonRetryableErrorCodes = [3000, 3003, 4004, 1008] as const;
const NonRetryableErrorDescriptionFallbacks: {
  [code in typeof NonRetryableErrorCodes[number]]: string;
} = {
  3000: 'Unauthorized',
  3003: 'Forbidden',
  4004: 'Not Found',
  1008: 'Violated policy',
};

function isNonRetryableHeartbeatFailure(evt: ServerHeartbeatFailedEvent) {
  return NonRetryableErrorCodes.some((code) =>
    evt.failure.message.includes(`code: ${code},`)
  );
}

function getDescriptionForNonRetryableError(error: Error): string {
  // Give a description from the error message when provided, otherwise fallback
  // to the generic error description.
  const reason = error.message.match(/code: \d+, reason: (.*)$/)?.[1];
  return reason && reason.length > 0
    ? reason.endsWith('.')
      ? reason.slice(0, -1)
      : reason // Remove trailing period
    : NonRetryableErrorDescriptionFallbacks[
        Number(
          error.message.match(/code: (\d+),/)?.[1]
        ) as typeof NonRetryableErrorCodes[number]
      ] ?? 'Unknown';
}

const openConnectionClosedWithNonRetryableErrorToast = (
  connectionInfo: ConnectionInfo,
  error: Error
) => {
  openToast(`non-retryable-error-encountered--${connectionInfo.id}`, {
    title: `Unable to connect to ${getConnectionTitle(connectionInfo)}`,
    description: `Reason: ${getDescriptionForNonRetryableError(
      error
    )}. To continue to use this connection either disconnect and reconnect, or refresh your page.`,
    variant: 'warning',
  });
};

export const connectInNewWindow =
  (connectionInfo: ConnectionInfo): ConnectionsThunkAction<void> =>
  (_dispatch, _getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('connect-in-new-window', connectionInfo.id);
  };

export const connect = (
  connectionInfo: ConnectionInfo
): ConnectionsThunkAction<
  Promise<void>,
  | ConnectionAttemptStartAction
  | ConnectionAttemptErrorAction
  | ConnectionAttemptSuccessAction
  | ConnectionAttemptCancelledAction
> => {
  return connectWithOptions(connectionInfo, { forceSave: false });
};

export const saveAndConnect = (
  connectionInfo: ConnectionInfo
): ConnectionsThunkAction<
  Promise<void>,
  | ConnectionAttemptStartAction
  | ConnectionAttemptErrorAction
  | ConnectionAttemptSuccessAction
  | ConnectionAttemptCancelledAction
> => {
  return connectWithOptions(connectionInfo, { forceSave: true });
};

const connectWithOptions = (
  connectionInfo: ConnectionInfo,
  options: {
    forceSave: boolean;
  }
): ConnectionsThunkAction<
  Promise<void>,
  | ConnectionAttemptStartAction
  | ConnectionAttemptErrorAction
  | ConnectionAttemptSuccessAction
  | ConnectionAttemptCancelledAction
> => {
  return async (
    dispatch,
    getState,
    {
      preferences,
      logger: { log, debug, mongoLogId },
      track,
      appName,
      getExtraConnectionData,
      connectFn,
    }
  ) => {
    let inflightConnection = InFlightConnections.get(connectionInfo.id);
    if (inflightConnection) {
      return inflightConnection;
    }
    inflightConnection = (async () => {
      const deviceAuthAbortController = new AbortController();

      try {
        if (
          getCurrentConnectionStatus(getState(), connectionInfo.id) ===
          'connected'
        ) {
          return;
        }

        if (!connectable(connectionInfo)) {
          return;
        }

        const isAutoconnectAttempt = isAutoconnectInfo(
          getState(),
          connectionInfo.id
        );

        connectionInfo = cloneDeep(connectionInfo);

        const {
          forceConnectionOptions,
          browserCommandForOIDCAuth,
          maximumNumberOfActiveConnections,
          telemetryAnonymousId,
        } = preferences.getPreferences();

        const connectionProgress = getNotificationTriggers();

        if (
          typeof maximumNumberOfActiveConnections !== 'undefined' &&
          getActiveConnectionsCount(getState().connections) >=
            maximumNumberOfActiveConnections
        ) {
          connectionProgress.openMaximumConnectionsReachedToast(
            maximumNumberOfActiveConnections
          );
          return;
        }

        dispatch({
          type: ActionTypes.ConnectionAttemptStart,
          connectionInfo,
          options: { forceSave: options.forceSave },
        });

        track(
          'Connection Attempt',
          {
            is_favorite: connectionInfo.savedConnectionType === 'favorite',
            is_new: isNewConnection(getState(), connectionInfo.id),
          },
          connectionInfo
        );

        debug('connecting with connectionInfo', connectionInfo);

        log.info(
          mongoLogId(1_001_000_004),
          'Connection UI',
          'Initiating connection attempt',
          { isAutoconnectAttempt }
        );

        // Connection form allows to start connecting with invalid connection
        // strings, so throw fast if it's not valid before doing anything else
        ensureWellFormedConnectionString(
          connectionInfo.connectionOptions.connectionString
        );

        connectionProgress.openConnectionStartedToast(connectionInfo, () => {
          dispatch(disconnect(connectionInfo.id));
        });

        const { connectionOptions, ...restOfTheConnectionInfo } =
          connectionInfo;

        const adjustedConnectionInfoForConnection: ConnectionInfo = merge(
          cloneDeep(restOfTheConnectionInfo),
          {
            connectionOptions: adjustConnectionOptionsBeforeConnect({
              connectionOptions: merge(
                cloneDeep(connectionOptions),
                SecretsForConnection.get(connectionInfo.id) ?? {}
              ),
              connectionId: connectionInfo.id,
              defaultAppName: appName,
              preferences: {
                forceConnectionOptions: forceConnectionOptions ?? [],
                browserCommandForOIDCAuth,
                telemetryAnonymousId,
              },
              notifyDeviceFlow: (deviceFlowInfo) => {
                connectionProgress.openNotifyDeviceAuthModal(
                  connectionInfo,
                  deviceFlowInfo.verificationUrl,
                  deviceFlowInfo.userCode,
                  () => {
                    void dispatch(disconnect(connectionInfo.id));
                  },
                  deviceAuthAbortController.signal
                );
              },
            }),
          }
        );

        // Temporarily disable Atlas Streams connections until https://jira.mongodb.org/browse/STREAMS-862
        // is done.
        if (isAtlasStreamsInstance(adjustedConnectionInfoForConnection)) {
          throw new Error(
            'Atlas Stream Processing is not yet supported on MongoDB Compass. To work with your Stream Processing Instance, connect with mongosh or MongoDB for VS Code.'
          );
        }

        const connectionAttempt = createConnectionAttempt({
          logger: log.unbound,
          proxyOptions: proxyPreferenceToProxyOptions(
            preferences.getPreferences().proxy
          ),
          connectFn,
        });

        ConnectionAttemptForConnection.set(
          connectionInfo.id,
          connectionAttempt
        );

        const dataService = await connectionAttempt.connect(
          adjustedConnectionInfoForConnection.connectionOptions
        );

        // This is how connection attempt indicates that the connection was
        // aborted
        if (!dataService || connectionAttempt.isClosed()) {
          dispatch({
            type: ActionTypes.ConnectionAttemptCancelled,
            connectionId: connectionInfo.id,
          });
          return;
        }

        let showedNonRetryableErrorToast = false;
        // Listen for non-retry-able errors on failed server heartbeats.
        // These can happen on compass web when:
        // - A user's session has ended.
        // - The user's roles have changed.
        // - The cluster / group they are trying to connect to has since been deleted.
        // When we encounter one we disconnect. This is to avoid polluting logs/metrics
        // and to avoid constantly retrying to connect when we know it'll fail.
        dataService.on(
          'serverHeartbeatFailed',
          (evt: ServerHeartbeatFailedEvent) => {
            if (!isNonRetryableHeartbeatFailure(evt)) {
              return;
            }

            if (!dataService.isConnected() || showedNonRetryableErrorToast) {
              return;
            }

            openConnectionClosedWithNonRetryableErrorToast(
              connectionInfo,
              evt.failure
            );
            showedNonRetryableErrorToast = true;
            void dataService.disconnect();
          }
        );

        dataService.on('oidcAuthFailed', (error) => {
          openToast('oidc-auth-failed', {
            title: `Failed to authenticate for ${getConnectionTitle(
              connectionInfo
            )}`,
            description: error,
            variant: 'important',
          });
        });

        dataService.on('connectionInfoSecretsChanged', () => {
          void dataService.getUpdatedSecrets().then(
            (secrets) => {
              SecretsForConnection.set(connectionInfo.id, secrets);
              if (!preferences.getPreferences().persistOIDCTokens) {
                return;
              }
              const info = getCurrentConnectionInfo(
                getState(),
                connectionInfo.id
              );
              if (!info) {
                return;
              }
              void dispatch(
                saveConnectionInfo(
                  merge(cloneDeep(info), { connectionOptions: secrets })
                )
              );
            },
            () => {
              // Do nothing if getting secrets failed
            }
          );
        });

        dataService.addReauthenticationHandler(() => {
          return showOIDCReauthModal(connectionInfo);
        });

        DataServiceForConnection.set(connectionInfo.id, dataService);

        try {
          await dispatch(
            saveConnectionInfo(
              merge(
                cloneDeep(
                  // See `ConnectionAttemptStartAction` handler in the reducer:
                  // in case of existing connection from storage, we keep the
                  // stored version in the state, in case of new connection,
                  // this is the whole info as was passed to the connect method
                  getCurrentConnectionInfo(getState(), connectionInfo.id)
                ),
                {
                  // Update lastUsed and secrets if connection was successful
                  lastUsed: new Date(),
                  ...(preferences.getPreferences().persistOIDCTokens
                    ? {
                        connectionOptions:
                          await dataService.getUpdatedSecrets(),
                      }
                    : {}),
                }
              )
            )
          );
        } catch (err) {
          debug(
            'failed to update connection info after successful connect',
            err
          );
        }

        track(
          'New Connection',
          async () => {
            const [
              { dataLake, genuineMongoDB, host, build, isAtlas, isLocalAtlas },
              [extraInfo, resolvedHostname],
            ] = await Promise.all([
              dataService.instance(),
              getExtraConnectionData(connectionInfo),
            ]);

            const connections = getState().connections;
            // Counting all connections, we need to filter out any connections currently being created
            const totalConnectionsCount = Object.values(
              connections.byId
            ).filter(({ isBeingCreated }) => !isBeingCreated).length;
            const activeConnectionsCount =
              getActiveConnectionsCount(connections);
            const inactiveConnectionsCount =
              totalConnectionsCount - activeConnectionsCount;

            return {
              is_atlas: isAtlas,
              atlas_hostname: isAtlas ? resolvedHostname : null,
              is_local_atlas: isLocalAtlas,
              is_dataLake: dataLake.isDataLake,
              is_enterprise: build.isEnterprise,
              is_genuine: genuineMongoDB.isGenuine,
              non_genuine_server_name: genuineMongoDB.dbType,
              server_version: build.version,
              server_arch: host.arch,
              server_os_family: host.os_family,
              topology_type: dataService.getCurrentTopologyType(),
              num_active_connections: activeConnectionsCount,
              num_inactive_connections: inactiveConnectionsCount,
              ...extraInfo,
            };
          },
          connectionInfo
        );

        debug(
          'connection attempt succeeded with connection info',
          connectionInfo
        );

        connectionProgress.openConnectionSucceededToast(connectionInfo);

        // Emit before changing state because some plugins rely on this
        connectionsEventEmitter.emit(
          'connected',
          connectionInfo.id,
          connectionInfo
        );

        dispatch({
          type: ActionTypes.ConnectionAttemptSuccess,
          connectionId: connectionInfo.id,
        });

        const { networkTraffic, showEndOfLifeConnectionModal } =
          preferences.getPreferences();

        if (
          getGenuineMongoDB(connectionInfo.connectionOptions.connectionString)
            .isGenuine === false
        ) {
          dispatch(showNonGenuineMongoDBWarningModal(connectionInfo.id));
        } else if (showEndOfLifeConnectionModal) {
          void dataService
            .instance()
            .then(async (instance) => {
              const { version } = instance.build;
              const latestEndOfLifeServerVersion =
                await getLatestEndOfLifeServerVersion(networkTraffic);
              if (isEndOfLifeVersion(version, latestEndOfLifeServerVersion)) {
                dispatch(
                  showEndOfLifeMongoDBWarningModal(
                    connectionInfo.id,
                    instance.build.version
                  )
                );
              }
            })
            .catch((err) => {
              debug(
                'failed to get instance details to determine if the server version is end-of-life',
                err
              );
            });
        }
      } catch (err) {
        dispatch(connectionAttemptError(connectionInfo, err));
      } finally {
        deviceAuthAbortController.abort();
        ConnectionAttemptForConnection.delete(connectionInfo.id);
        InFlightConnections.delete(connectionInfo.id);
      }
    })();
    InFlightConnections.set(connectionInfo.id, inflightConnection);
    return inflightConnection;
  };
};

function ensureWellFormedConnectionString(connectionString: string) {
  new ConnectionString(connectionString);
}

const saveConnectionInfo = (
  connectionInfo: ConnectionInfo
): ConnectionsThunkAction<
  Promise<ConnectionInfo | null>,
  SaveConnectionInfoAction
> => {
  return async (
    dispatch,
    getState,
    { connectionStorage, track, logger: { debug } }
  ) => {
    // Never save autoconnection info
    if (isAutoconnectInfo(getState(), connectionInfo.id)) {
      return null;
    }

    try {
      // Only allow saving if connection string is valid
      ensureWellFormedConnectionString(
        connectionInfo.connectionOptions.connectionString
      );

      const savedConnectionInfo =
        (await connectionStorage.save?.({ connectionInfo })) ?? connectionInfo;

      if (isNewConnection(getState(), connectionInfo.id)) {
        track(
          'Connection Created',
          { color: savedConnectionInfo.favorite?.color },
          savedConnectionInfo
        );
      }
      dispatch({
        type: ActionTypes.SaveConnectionInfo,
        connectionInfo: savedConnectionInfo,
      });
      return savedConnectionInfo;
    } catch (err) {
      debug(`error saving connection with id ${connectionInfo.id}`, err);
      openToast(`save-connection-error-${connectionInfo.id}`, {
        title: 'An error occurred while saving the connection',
        description: (err as Error).message,
        variant: 'warning',
      });
      return null;
    }
  };
};

export const saveEditedConnectionInfo = (
  connectionInfo: ConnectionInfo
): ConnectionsThunkAction<Promise<void>, SaveEditedConnectionAction> => {
  return async (dispatch) => {
    await dispatch(saveConnectionInfo(connectionInfo));
    dispatch({
      type: ActionTypes.SaveEditedConnection,
      connectionId: connectionInfo.id,
    });
  };
};

export const createNewConnection = (): ConnectionsThunkAction<
  void,
  CreateNewConnectionAction
> => {
  return (dispatch, getState) => {
    // We don't allow another edit to start while there is one in progress
    if (getState().isEditingConnectionInfoModalOpen) {
      return;
    }
    dispatch({ type: ActionTypes.CreateNewConnection });
  };
};

export const editConnection = (
  connectionId: ConnectionId
): ConnectionsThunkAction<void, EditConnectionAction> => {
  return (dispatch, getState) => {
    // We don't allow another edit to start while there is one in progress
    if (getState().isEditingConnectionInfoModalOpen) {
      return;
    }
    dispatch({ type: ActionTypes.EditConnection, connectionId });
  };
};

export const duplicateConnection = (
  connectionId: ConnectionId,
  { autoDuplicate }: { autoDuplicate: boolean } = { autoDuplicate: false }
): ConnectionsThunkAction<void, DuplicateConnectionAction> => {
  return (dispatch, getState) => {
    // We don't allow another edit to start while there is one in progress
    if (getState().isEditingConnectionInfoModalOpen) {
      return;
    }

    const currentConnectionInfo = getCurrentConnectionInfo(
      getState(),
      connectionId
    );

    if (!currentConnectionInfo) {
      return;
    }

    const duplicateInfo = createConnectionInfoDuplicate(
      currentConnectionInfo,
      Object.values(getState().connections.byId).map((connectionState) => {
        return connectionState.info;
      })
    );

    dispatch({
      type: ActionTypes.DuplicateConnection,
      duplicateInfo,
      isAutoDuplicate: autoDuplicate,
    });

    if (autoDuplicate) {
      void dispatch(saveConnectionInfo(duplicateInfo));
    }
  };
};

export const cancelEditConnection = (
  connectionId: ConnectionId
): CancelEditConnectionAction => {
  return { type: ActionTypes.CancelEditConnection, connectionId };
};

const cleanupConnection = (
  connectionId: ConnectionId
): ConnectionsThunkAction<void, never> => {
  return (
    _dispatch,
    getState,
    { logger: { log, debug, mongoLogId }, track }
  ) => {
    log.info(
      mongoLogId(1_001_000_313),
      'Connection UI',
      'Initiating disconnect attempt'
    );

    const currentStatus = getCurrentConnectionStatus(getState(), connectionId);

    // We specifically want to track Disconnected even when it's not really
    // triggered by user at all, so we put it in the cleanup function that is
    // called every time you disconnect, or remove a connection, or all of them,
    // or close the app. Only track when connection is either connected or
    // connecting, we might be calling this on something that was never
    // connected
    if (currentStatus === 'connected' || currentStatus === 'connecting') {
      track(
        'Connection Disconnected',
        {},
        getCurrentConnectionInfo(getState(), connectionId)
      );
    }

    const { closeConnectionStatusToast } = getNotificationTriggers();

    const connectionInfo = getCurrentConnectionInfo(getState(), connectionId);

    closeConnectionStatusToast(connectionId);

    const connectionAttempt = ConnectionAttemptForConnection.get(connectionId);
    const dataService = DataServiceForConnection.get(connectionId);

    void Promise.all([
      connectionAttempt?.cancelConnectionAttempt(),
      dataService?.disconnect(),
    ]).then(
      () => {
        debug('connection closed', connectionId);
      },
      (err) => {
        log.error(
          mongoLogId(1_001_000_314),
          'Connection UI',
          'Disconnect attempt failed',
          { error: (err as Error).message }
        );
      }
    );

    ConnectionAttemptForConnection.delete(connectionId);
    DataServiceForConnection.delete(connectionId);

    connectionsEventEmitter.emit('disconnected', connectionId, connectionInfo!);
  };
};

export const disconnect = (
  connectionId: ConnectionId
): ConnectionsThunkAction<void> => {
  return (dispatch, getState, { logger: { debug } }) => {
    debug('closing connection with connectionId', connectionId);
    if (getState().connections.byId[connectionId]?.isAutoconnectInfo) {
      setSessionConnectionStatus(connectionId, 'disconnected');
    }
    dispatch(cleanupConnection(connectionId));
    dispatch({ type: ActionTypes.Disconnect, connectionId });
  };
};

export const removeConnection = (
  connectionId: ConnectionId
): ConnectionsThunkAction<void, RemoveConnectionAction> => {
  return (
    dispatch,
    getState,
    { connectionStorage, track, logger: { debug } }
  ) => {
    const connectionInfo = getCurrentConnectionInfo(getState(), connectionId);

    if (!connectionInfo) {
      return;
    }

    dispatch(cleanupConnection(connectionInfo.id));

    void connectionStorage.delete?.({ id: connectionId }).catch((err) => {
      debug('failed to delete connection', err);
    });

    dispatch({
      type: ActionTypes.RemoveConnection,
      connectionId,
    });

    track('Connection Removed', {}, connectionInfo);
  };
};

export const toggleConnectionFavoritedStatus = (
  connectionId: ConnectionId
): ConnectionsThunkAction<void, ToggleFavoriteConnectionAction> => {
  return (dispatch, getState) => {
    if (isAutoconnectInfo(getState(), connectionId)) {
      return;
    }

    if (!hasConnectionForId(getState(), connectionId)) {
      return;
    }

    dispatch({ type: ActionTypes.ToggleFavoriteConnection, connectionId });

    // After ToggleFavoriteConnection was dispatched, connectionInfo in state
    // was already updated to toggle the value, we can use it now to save the
    // connection in storage
    const newConnectionInfo = getCurrentConnectionInfo(
      getState(),
      connectionId
    );

    // Making TS happy, should never end up here
    if (!newConnectionInfo) {
      throw new Error('No connection info to save');
    }

    void dispatch(saveConnectionInfo(newConnectionInfo));
  };
};

function isRecentConnection(connection: ConnectionState) {
  return (
    !connection.info.savedConnectionType ||
    connection.info.savedConnectionType === 'recent'
  );
}

export const removeAllRecentConnections = (): ConnectionsThunkAction<
  void,
  RemoveAllRecentConnectionsActions
> => {
  return (dispatch, getState, { connectionStorage, track }) => {
    const toRemove = Object.values(getState().connections.byId).filter(
      (connection) => {
        return isRecentConnection(connection);
      }
    );

    void Promise.allSettled(
      toRemove.map((connection) => {
        dispatch(cleanupConnection(connection.info.id));
        track('Connection Removed', {}, connection.info);
        return connectionStorage.delete?.({ id: connection.info.id });
      })
    );

    dispatch({ type: ActionTypes.RemoveAllRecentConnections });
  };
};

export const showNonGenuineMongoDBWarningModal = (
  connectionId: string
): ConnectionsThunkAction<void> => {
  return (_dispatch, getState, { track }) => {
    const connectionInfo = getCurrentConnectionInfo(getState(), connectionId);
    track('Screen', { name: 'non_genuine_mongodb_modal' }, connectionInfo);
    void _showNonGenuineMongoDBWarningModal(connectionInfo);
  };
};

export const showEndOfLifeMongoDBWarningModal = (
  connectionId: string,
  version: string
): ConnectionsThunkAction<void> => {
  return (_dispatch, getState, { track }) => {
    const connectionInfo = getCurrentConnectionInfo(getState(), connectionId);
    track('Screen', { name: 'end_of_life_mongodb_modal' }, connectionInfo);
    void _showEndOfLifeMongoDBWarningModal(connectionInfo, version);
  };
};

export const importConnections = (options: {
  content: string;
  options?: ImportConnectionOptions;
  signal?: AbortSignal;
}): ConnectionsThunkAction<
  Promise<void>,
  ConnectionsImportStartAction | ConnectionsImportFinishAction
> => {
  return async (dispatch, _getState, { connectionStorage }) => {
    dispatch({ type: ActionTypes.ConnectionsImportStart });
    let connections: ConnectionInfo[] = [];
    let error;
    try {
      if (connectionStorage.importConnections) {
        await connectionStorage.importConnections(options);
        connections = await connectionStorage.loadAll();
      }
    } catch (err) {
      error = err;
    }
    dispatch({
      type: ActionTypes.ConnectionsImportFinish,
      connections: connections,
    });
    // Because most of the import state and logic is still in a separate package
    // we throw here to allow the import flow to continue working as it was
    // before
    if (error) {
      throw error;
    }
  };
};

export const openSettingsModal = (
  tab?: string
): ConnectionsThunkAction<void> => {
  return (_dispatch, _getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('open-compass-settings', tab);
  };
};

export function configureStore(
  preloadConnectionInfos: ConnectionInfo[] | undefined,
  thunkArg: ThunkExtraArg
) {
  return createStore(
    // (state, action) => {
    //   const newState = reducer(state, action);
    //   console.log(action.type);
    //   // console.log(action.type, { action, old: state, new: newState });
    //   return newState;
    // },
    reducer,
    {
      ...INITIAL_STATE,
      connections: getInitialConnectionsStateForConnectionInfos(
        preloadConnectionInfos
      ),
    },
    applyMiddleware(thunk.withExtraArgument(thunkArg))
  );
}
