import type {
  SidebarCollection,
  SidebarConnectedConnection,
  SidebarDatabase,
  ConnectionsNavigationTreeProps,
  SidebarConnection,
  SidebarNotConnectedConnection,
} from '@mongodb-js/compass-connections-navigation';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import toNS from 'mongodb-ns';
import { useCallback, useEffect, useMemo, useReducer } from 'react';

type ExpandedDatabases = Record<
  SidebarDatabase['_id'],
  'expanded' | 'tempExpanded' | undefined
>;
type ExpandedConnections = Record<
  ConnectionInfo['id'],
  {
    state: 'collapsed' | 'tempExpanded' | undefined;
    databases: ExpandedDatabases;
  }
>;

interface Match {
  isMatch?: boolean;
}

type FilteredCollection = SidebarCollection & Match;
type FilteredDatabase = Omit<SidebarDatabase, 'collections'> &
  Match & {
    collections: FilteredCollection[];
  };
type FilteredConnection = (
  | SidebarNotConnectedConnection
  | (Omit<SidebarConnectedConnection, 'databases'> & {
      databases: FilteredDatabase[];
    })
) &
  Match;

const filterConnections = (
  connections: SidebarConnection[],
  regex: RegExp
): FilteredConnection[] => {
  const results: FilteredConnection[] = [];
  for (const connection of connections) {
    const isMatch = regex.test(connection.name);
    let childMatches: FilteredDatabase[] = [];
    if (connection.connectionStatus === ConnectionStatus.Connected) {
      childMatches = filterDatabases(connection.databases, regex);
    }

    if (isMatch || childMatches.length) {
      results.push({
        ...connection,
        isMatch,
        ...(connection.connectionStatus === ConnectionStatus.Connected
          ? {
              databases: childMatches.length
                ? childMatches
                : connection.databases,
            }
          : {}),
      });
    }
  }
  return results;
};

const filterDatabases = (
  databases: SidebarDatabase[],
  regex: RegExp
): FilteredDatabase[] => {
  const results: FilteredDatabase[] = [];
  for (const db of databases) {
    const isMatch = regex.test(db.name);
    const childMatches = filterCollections(db.collections, regex);

    if (isMatch || childMatches.length) {
      results.push({
        ...db,
        isMatch,
        collections: childMatches.length ? childMatches : db.collections,
      });
    }
  }
  return results;
};

const filterCollections = (
  collections: SidebarCollection[],
  regex: RegExp
): FilteredCollection[] => {
  return collections
    .filter(({ name }) => regex.test(name))
    .map((collection) => ({ ...collection, isMatch: true }));
};

/**
 * Take the starting expandedConnections, and temporarily expand items that:
 * - are included in the filterResults
 * - their children are a match
 */
const temporarilyExpand = (
  expandedConnections: ExpandedConnections,
  filterResults: FilteredConnection[]
): ExpandedConnections => {
  const newExpanded = { ...expandedConnections };
  filterResults.forEach((connection) => {
    if (connection.connectionStatus === ConnectionStatus.Connected) {
      const {
        connectionInfo: { id: connectionId },
        databases,
      } = connection;
      const childrenDbsAreMatch = databases.length && databases[0].isMatch;
      if (!newExpanded[connectionId]) {
        newExpanded[connectionId] = { state: undefined, databases: {} };
      }
      if (
        childrenDbsAreMatch &&
        newExpanded[connectionId].state === 'collapsed'
      ) {
        newExpanded[connectionId].state = 'tempExpanded';
      }
      databases.forEach(({ _id: databaseId, collections }) => {
        const childrenCollsAreMatch =
          collections.length && collections[0].isMatch;
        if (childrenCollsAreMatch && collections.length) {
          if (newExpanded[connectionId].state === 'collapsed') {
            newExpanded[connectionId].state = 'tempExpanded';
          }
          if (!newExpanded[connectionId].databases[databaseId]) {
            newExpanded[connectionId].databases[databaseId] = 'tempExpanded';
          }
        }
      });
    }
  });
  return newExpanded;
};

/**
 * Reverts 'temporarilyExpand', bringing the items back to collapsed state
 */
const revertTemporaryExpanded = (
  expandedConnections: ExpandedConnections
): ExpandedConnections => {
  const cleared: ExpandedConnections = Object.fromEntries(
    Object.entries(expandedConnections).map(
      ([connectionId, { state, databases }]) => [
        connectionId,
        {
          state: state === 'tempExpanded' ? 'collapsed' : state,
          databases: Object.fromEntries(
            Object.entries(databases || []).map(([dbId, dbState]) => [
              dbId,
              dbState === 'tempExpanded' ? undefined : dbState,
            ])
          ),
        },
      ]
    )
  );
  return cleared;
};

interface ConnectionsState {
  expanded: ExpandedConnections;
  filtered: SidebarConnection[] | undefined;
}

const FILTER_CONNECTIONS =
  'sidebar/active-connections/FILTER_CONNECTIONS' as const;
interface FilterConnectionsAction {
  type: typeof FILTER_CONNECTIONS;
  connections: SidebarConnection[];
  filterRegex: RegExp;
}

const CLEAR_FILTER = 'sidebar/active-connections/CLEAR_FILTER' as const;
interface ClearConnectionsFilterAction {
  type: typeof CLEAR_FILTER;
}

const CONNECTION_TOGGLE =
  'sidebar/active-connections/CONNECTION_TOGGLE' as const;
interface ToggleConnectionAction {
  type: typeof CONNECTION_TOGGLE;
  connectionId: ConnectionInfo['id'];
  expand: boolean;
}

const DATABASE_TOGGLE = 'sidebar/active-connections/DATABASE_TOGGLE' as const;
interface ToggleDatabaseAction {
  type: typeof DATABASE_TOGGLE;
  connectionId: ConnectionInfo['id'];
  databaseId: string;
  expand: boolean;
}

const CONNECTIONS_CHANGED =
  'sidebar/active-connections/CONNECTIONS_CHANGED' as const;
interface ConnectionsChangedAction {
  type: typeof CONNECTIONS_CHANGED;
  connections: ConnectionInfo[];
}

type ConnectionsAction =
  | FilterConnectionsAction
  | ClearConnectionsFilterAction
  | ToggleConnectionAction
  | ToggleDatabaseAction
  | ConnectionsChangedAction;

const connectionsReducer = (
  state: ConnectionsState,
  action: ConnectionsAction
): ConnectionsState => {
  switch (action.type) {
    case FILTER_CONNECTIONS: {
      const filtered = filterConnections(
        action.connections,
        action.filterRegex
      );
      const persistingExpanded = revertTemporaryExpanded(state.expanded);
      return {
        ...state,
        filtered,
        expanded: temporarilyExpand(persistingExpanded, filtered),
      };
    }
    case CLEAR_FILTER:
      return {
        ...state,
        filtered: undefined,
        expanded: revertTemporaryExpanded(state.expanded),
      };
    case CONNECTION_TOGGLE: {
      const { connectionId, expand } = action;
      const currentState = state.expanded[connectionId]?.state;
      if (
        (currentState === 'collapsed' && !expand) ||
        (!currentState && expand)
      )
        return state;

      return {
        ...state,
        expanded: {
          ...state.expanded,
          [connectionId]: {
            ...state.expanded[connectionId],
            state: expand ? undefined : 'collapsed',
          },
        },
      };
    }
    case DATABASE_TOGGLE: {
      const { connectionId, databaseId, expand } = action;
      const currentState = state.expanded[connectionId]?.databases[databaseId];
      if ((!currentState && !expand) || (currentState === 'expanded' && expand))
        return state;

      return {
        ...state,
        expanded: {
          ...state.expanded,
          [connectionId]: {
            ...state.expanded[connectionId],
            databases: {
              ...state.expanded[connectionId]?.databases,
              [databaseId]: expand ? 'expanded' : undefined,
            },
          },
        },
      };
    }
    case CONNECTIONS_CHANGED: {
      const { connections } = action;
      // this is to get rid of stale connections. if the user connects again, they will start in the default state
      return {
        ...state,
        expanded: Object.fromEntries(
          connections.map(({ id: connectionId }) => [
            connectionId,
            state.expanded[connectionId] || { state: undefined, databases: {} },
          ])
        ),
      };
    }
    default:
      return state;
  }
};

type UseFilteredConnectionsHookResult = {
  filtered: SidebarConnection[] | undefined;
  expanded: ConnectionsNavigationTreeProps['expanded'];
  onConnectionToggle(
    this: void,
    connectionId: string,
    isExpanded: boolean
  ): void;
  onDatabaseToggle(
    this: void,
    connectionId: string,
    databaseId: string,
    isExpanded: boolean
  ): void;
  onConnectionsChanged(this: void, newConnections: ConnectionInfo[]): void;
};

export const useFilteredConnections = (
  connections: SidebarConnection[],
  filterRegex: RegExp | null,
  _fetchAllCollections: () => void,
  _onDatabaseExpand: (connectionId: string, databaseId: string) => void
): UseFilteredConnectionsHookResult => {
  const [{ filtered, expanded }, dispatch] = useReducer(connectionsReducer, {
    filtered: undefined,
    expanded: {},
  });

  // filter updates
  // connections change often, but the effect only uses connections if the filter is active
  // so we use this conditional dependency to avoid too many calls
  const connectionsButOnlyIfFilterIsActive = filterRegex && connections;
  useEffect(() => {
    if (!filterRegex) {
      dispatch({ type: CLEAR_FILTER });
    } else if (connectionsButOnlyIfFilterIsActive) {
      // the above check is extra just to please TS

      // When filtering, emit an event so that we can fetch all collections. This
      // is required as a workaround for the synchronous nature of the current
      // filtering feature
      _fetchAllCollections();

      dispatch({
        type: FILTER_CONNECTIONS,
        connections: connectionsButOnlyIfFilterIsActive,
        filterRegex,
      });
    }
  }, [filterRegex, connectionsButOnlyIfFilterIsActive, _fetchAllCollections]);

  const onConnectionToggle = useCallback(
    (connectionId: string, expand: boolean) =>
      dispatch({ type: CONNECTION_TOGGLE, connectionId, expand }),
    []
  );

  const onDatabaseToggle = useCallback(
    (connectionId: string, namespace: string, expand: boolean) => {
      const { database: databaseId } = toNS(namespace);
      if (expand && !expanded[connectionId]?.databases[databaseId]) {
        // side effect -> we need this to load collections
        _onDatabaseExpand(connectionId, databaseId);
      }
      dispatch({ type: DATABASE_TOGGLE, connectionId, databaseId, expand });
    },
    [_onDatabaseExpand, expanded]
  );

  const onConnectionsChanged = useCallback((connections: ConnectionInfo[]) => {
    dispatch({ type: CONNECTIONS_CHANGED, connections: connections });
  }, []);

  const expandedMemo: ConnectionsNavigationTreeProps['expanded'] =
    useMemo(() => {
      const result = connections.reduce(
        (obj, { connectionInfo: { id: connectionId } }) => {
          obj[connectionId] =
            expanded[connectionId]?.state !== 'collapsed'
              ? Object.fromEntries(
                  Object.entries(expanded[connectionId]?.databases || {}).map(
                    ([dbId, dbState]) => [dbId, !!dbState]
                  )
                )
              : false;
          return obj;
        },
        {} as Record<string, false | Record<string, boolean>>
      );
      return result;
    }, [expanded, connections]);

  return {
    filtered,
    expanded: expandedMemo,
    onConnectionToggle,
    onDatabaseToggle,
    onConnectionsChanged,
  };
};
