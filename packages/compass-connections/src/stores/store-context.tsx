import React, { createContext, useContext, useRef, useState } from 'react';
import type {
  MapStateToProps,
  ReactReduxContextValue,
  TypedUseSelectorHook,
} from 'react-redux';
import {
  connect as reduxConnect,
  createStoreHook,
  createDispatchHook,
  createSelectorHook,
} from 'react-redux';
import type {
  configureStore,
  ConnectionId,
  ConnectionState,
} from './connections-store-redux';
import {
  cancelEditConnection,
  connect as connectionsConnect,
  saveAndConnect,
  connectionsEventEmitter,
  createNewConnection,
  disconnect,
  duplicateConnection,
  editConnection,
  getDataServiceForConnection,
  removeAllRecentConnections,
  removeConnection,
  saveEditedConnectionInfo,
  showNonGenuineMongoDBWarningModal,
  toggleConnectionFavoritedStatus,
  importConnections,
  refreshConnections,
} from './connections-store-redux';
import type { Store } from 'redux';
import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import { createServiceLocator } from 'hadron-app-registry';
import { isEqual } from 'lodash';

type ConnectionsStore = ReturnType<typeof configureStore> extends Store<
  infer S,
  infer A
> & { dispatch: infer D }
  ? { state: S; actions: A; dispatch: D }
  : never;

export const ConnectionsStoreContext = React.createContext<
  ReactReduxContextValue<ConnectionsStore['state']>
  // @ts-expect-error not possible to correctly pass default value here
>(null);

/**
 * @internal should not be directly exported from this package
 */
export const useStore = createStoreHook(
  ConnectionsStoreContext
) as () => ReturnType<typeof configureStore>;

/**
 * @internal should not be directly exported from this package
 */
export const useDispatch = createDispatchHook(
  ConnectionsStoreContext
) as () => ConnectionsStore['dispatch'];

/**
 * @internal should not be directly exported from this package
 */
export const useSelector: TypedUseSelectorHook<ConnectionsStore['state']> =
  createSelectorHook(ConnectionsStoreContext);

export const connect = ((
  mapState: MapStateToProps<unknown, unknown, unknown>,
  mapDispatch = null,
  mergeProps = null
) => {
  return reduxConnect(mapState, mapDispatch, mergeProps, {
    context: ConnectionsStoreContext,
  });
}) as typeof reduxConnect;

function getConnectionsActions(dispatch: ConnectionsStore['dispatch']) {
  return {
    connect: (connectionInfo: ConnectionInfo) => {
      return dispatch(connectionsConnect(connectionInfo));
    },
    saveAndConnect: (connectionInfo: ConnectionInfo) => {
      return dispatch(saveAndConnect(connectionInfo));
    },
    disconnect: (connectionId: ConnectionId) => {
      return dispatch(disconnect(connectionId));
    },
    createNewConnection: () => {
      return dispatch(createNewConnection());
    },
    editConnection: (connectionId: ConnectionId) => {
      return dispatch(editConnection(connectionId));
    },
    duplicateConnection: (
      connectionId: ConnectionId,
      options?: {
        autoDuplicate: boolean;
      }
    ) => {
      return dispatch(duplicateConnection(connectionId, options));
    },
    saveEditedConnection: (connectionInfo: ConnectionInfo) => {
      return dispatch(saveEditedConnectionInfo(connectionInfo));
    },
    cancelEditConnection: (connectionId: ConnectionId) => {
      return dispatch(cancelEditConnection(connectionId));
    },
    toggleFavoritedConnectionStatus: (connectionId: ConnectionId) => {
      return dispatch(toggleConnectionFavoritedStatus(connectionId));
    },
    removeConnection: (connectionId: ConnectionId) => {
      return dispatch(removeConnection(connectionId));
    },
    removeAllRecentConnections: () => {
      return dispatch(removeAllRecentConnections());
    },
    showNonGenuineMongoDBWarningModal: (connectionId: ConnectionId) => {
      return dispatch(showNonGenuineMongoDBWarningModal(connectionId));
    },
    importConnections: (...args: Parameters<typeof importConnections>) => {
      return dispatch(importConnections(...args));
    },
    refreshConnections: () => {
      return dispatch(refreshConnections());
    },
  };
}

const ConnectionActionsContext = createContext<ReturnType<
  typeof getConnectionsActions
> | null>(null);

/**
 * @internal We're using a provider here so that in test environment we can make
 * sure we're using the same object reference in all renders and so can safely
 * spy on the actions if test requires it. Should not be exported from this
 * package
 */
export const ConnectionActionsProvider: React.FunctionComponent = ({
  children,
}) => {
  const dispatch = useDispatch();
  const [actions] = useState(() => {
    return getConnectionsActions(dispatch);
  });
  return (
    <ConnectionActionsContext.Provider value={actions}>
      {children}
    </ConnectionActionsContext.Provider>
  );
};

export function useConnectionActions() {
  const actions = useContext(ConnectionActionsContext);
  if (!actions) {
    throw new Error(
      "Can't find connection actions in context. Are you using useConnectionActions hook in correct environment?"
    );
  }
  return actions;
}

export function useConnectionsListRef(): {
  getConnectionById(
    this: void,
    connectionId: string
  ): (ConnectionState & { title: string }) | undefined;
  current: readonly (ConnectionState & { title: string })[];
} {
  const storeRef = useRef(useStore());
  const [ref] = useState(() => {
    return {
      getConnectionById(connectionId: string) {
        const conn = storeRef.current.getState().connections.byId[connectionId];
        if (conn) {
          return { ...conn, title: getConnectionTitle(conn.info) };
        }
        return undefined;
      },
      get current() {
        return Object.values(storeRef.current.getState().connections.byId).map(
          (conn) => {
            return { ...conn, title: getConnectionTitle(conn.info) };
          }
        );
      },
    };
  });
  return ref;
}

function useConnections() {
  const actions = useConnectionActions();
  const connectionsListRef = useConnectionsListRef();
  return useRef({
    ...actions,
    ...connectionsListRef,
    getDataServiceForConnection,
    on: connectionsEventEmitter.on,
    off: connectionsEventEmitter.off,
    removeListener: connectionsEventEmitter.removeListener,
  }).current;
}

export type ConnectionsService = ReturnType<typeof useConnections>;

export const connectionsLocator = createServiceLocator(
  useConnections,
  'connectionsLocator'
);

function isShallowEqual(
  a: Record<string, unknown> | null,
  b: Record<string, unknown> | null
) {
  if (a === null || b === null) {
    return a === b;
  }
  const keys = new Set(Object.keys(a).concat(Object.keys(b)));
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Returns (optionally filtered) list of connection ids. If you need to render a
 * list of connections in the app, this hook allows us to subscribe to a list of
 * connection items without subscribing to the actual state of those
 * connections (subscription to those is usually required on a deeper level of
 * the rendering)
 */
export function useConnectionIds(
  filter?: (connection: ConnectionState) => boolean
): ConnectionId[] {
  return useSelector<ConnectionId[]>(
    (state) => {
      return state.connections.ids.filter((id) => {
        return filter?.(state.connections.byId[id]) ?? true;
      });
    },
    (a, b) => {
      return isEqual(a, b);
    }
  );
}

/**
 * Returns (optionally filtered) list of connection state and subscribes to
 * changes of all the connection state
 *
 * @deprecated should be avoided unless your component depends on literally all
 * the state of all the connections in the list at once which is very rarely the
 * case
 */
export function useConnectionsList(
  filter?: (connection: ConnectionState) => boolean
) {
  return useSelector<ConnectionState[]>(
    (state) => {
      return state.connections.ids
        .filter((id) => {
          return filter?.(state.connections.byId[id]) ?? true;
        })
        .map((id) => {
          return state.connections.byId[id];
        });
    },
    (a, b) => {
      if (a.length !== b.length) {
        return false;
      }
      if (a.length === 0) {
        return true;
      }
      return a.every((connA, index) => {
        return isShallowEqual(connA, b[index]);
      });
    }
  );
}

/**
 * Returns single connection state for a certain connection id and subscribes to
 * changes
 */
export function useConnectionForId(
  connectionId: ConnectionId
): (ConnectionState & { title: string }) | null {
  return useSelector(
    (state) => {
      const connection = state.connections.byId[connectionId];
      return connection
        ? { ...connection, title: getConnectionTitle(connection.info) }
        : null;
    },
    (a, b) => {
      return isShallowEqual(a, b);
    }
  );
}

/**
 * Returns only connection info state and a title and subscribes to changes
 */
export function useConnectionInfoForId(
  connectionId: ConnectionId
): (ConnectionInfo & { title: string }) | null {
  return useSelector(
    (state) => {
      const connection = state.connections.byId[connectionId];
      return connection
        ? { ...connection.info, title: getConnectionTitle(connection.info) }
        : null;
    },
    (a, b) => {
      return isShallowEqual(a, b);
    }
  );
}

/**
 * Returns a stable reference for the connection info when you need to access
 * the value without triggering the render
 */
export function useConnectionInfoRefForId(connectionId: ConnectionId): {
  current: (ConnectionInfo & { title: string }) | null;
} {
  const store = useStore();
  const [ref] = useState(() => {
    return {
      get current() {
        const connection = store.getState().connections.byId[connectionId];
        return connection
          ? { ...connection.info, title: getConnectionTitle(connection.info) }
          : null;
      },
    };
  });
  return ref;
}

export function useConnectionsColorList(): {
  id: ConnectionId;
  color: string | undefined;
}[] {
  return useSelector((state) => {
    return Object.values(state.connections.byId).map((connection) => {
      return {
        id: connection.info.id,
        color: connection.info.favorite?.color,
      };
    });
  }, isEqual);
}
