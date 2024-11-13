import _ from 'lodash';
import toNS from 'mongodb-ns';
import type {
  SidebarCollection,
  SidebarConnectedConnection,
  SidebarDatabase,
  ConnectionsNavigationTreeProps,
  SidebarConnection,
  SidebarNotConnectedConnection,
} from '@mongodb-js/compass-connections-navigation';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

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
  regex: RegExp | null,
  excludeInactive: boolean
): FilteredConnection[] => {
  const results: FilteredConnection[] = [];
  for (const connection of connections) {
    // Conditionally skip connections that aren't considered active
    const inactive =
      connection.connectionStatus !== 'connected' &&
      connection.connectionStatus !== 'connecting';
    if (excludeInactive && inactive) {
      continue;
    }
    const isMatch = !regex || regex.test(connection.name);
    let childMatches: FilteredDatabase[] = [];
    if (connection.connectionStatus === 'connected') {
      childMatches = filterDatabases(connection.databases, regex);
    }

    if (isMatch || childMatches.length) {
      results.push({
        ...connection,
        isMatch,
        ...(connection.connectionStatus === 'connected'
          ? {
              databases:
                !isMatch && childMatches.length
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
  regex: RegExp | null
): FilteredDatabase[] => {
  const results: FilteredDatabase[] = [];
  for (const db of databases) {
    const isMatch = !regex || regex.test(db.name);
    const childMatches = filterCollections(db.collections, regex);

    if (isMatch || childMatches.length) {
      // If the db doesn't match, we want to use just the matching collections.
      // if the db does match we include all the collections but we still record
      // if they match because if something does match then we want to expand
      // the database in temporarilyExpand below.
      const collections =
        !isMatch && childMatches.length
          ? childMatches
          : db.collections.map((collection) => ({
              ...collection,
              isMatch: !regex || regex.test(collection.name),
            }));
      results.push({
        ...db,
        isMatch,
        collections,
      });
    }
  }
  return results;
};

const filterCollections = (
  collections: SidebarCollection[],
  regex: RegExp | null
): FilteredCollection[] => {
  return collections
    .filter(({ name }) => !regex || regex.test(name))
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
    if (connection.connectionStatus === 'connected') {
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
          collections.length && collections.some((col) => col.isMatch);
        if (childrenCollsAreMatch && collections.length) {
          if (newExpanded[connectionId].state === 'collapsed') {
            newExpanded[connectionId].state = 'tempExpanded';
          }
          if (!newExpanded[connectionId].databases) {
            newExpanded[connectionId].databases = {
              [databaseId]: 'tempExpanded',
            };
          } else {
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

const collapseAll = (
  activeConnections: ConnectionInfo[]
): ExpandedConnections => {
  const expandedConnections: ExpandedConnections = {};
  for (const { id } of activeConnections) {
    expandedConnections[id] = {
      state: 'collapsed',
      databases: {},
    };
  }
  return expandedConnections;
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
  filterRegex: RegExp | null;
  excludeInactive: boolean;
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

const COLLAPSE_ALL = 'sidebar/active-connections/COLLAPSE_ALL' as const;

interface CollapseAllAction {
  type: typeof COLLAPSE_ALL;
  connections: ConnectionInfo[];
}

type ConnectionsAction =
  | FilterConnectionsAction
  | ClearConnectionsFilterAction
  | ToggleConnectionAction
  | ToggleDatabaseAction
  | ConnectionsChangedAction
  | CollapseAllAction;

const connectionsReducer = (
  state: ConnectionsState,
  action: ConnectionsAction
): ConnectionsState => {
  switch (action.type) {
    case COLLAPSE_ALL: {
      return {
        ...state,
        expanded: collapseAll(action.connections),
      };
    }
    case FILTER_CONNECTIONS: {
      const filtered = filterConnections(
        action.connections,
        action.filterRegex,
        action.excludeInactive
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
      if (currentState === 'collapsed' && !expand) return state;

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
      const currentState =
        state.expanded[connectionId]?.databases?.[databaseId];
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
  onCollapseAll(this: void): void;
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
};

function filteredConnectionsToSidebarConnection(
  filteredConnections: FilteredConnection[]
): SidebarConnection[] {
  const sidebarConnections: SidebarConnection[] = [];
  for (const connection of filteredConnections) {
    if (connection.connectionStatus === 'connected') {
      sidebarConnections.push({
        ..._.omit(connection, ['isMatch']),
        databases: connection.databases.map((database) => {
          return {
            ..._.omit(database, ['isMatch']),
            collections: database.collections.map((collection) =>
              _.omit(collection, ['isMatch'])
            ),
          };
        }),
      });
    } else {
      sidebarConnections.push({
        ..._.omit(connection, ['isMatch']),
      });
    }
  }
  return sidebarConnections;
}

export type ConnectionsFilter = {
  regex: RegExp | null;
  excludeInactive: boolean;
};

export const useFilteredConnections = ({
  connections,
  filter,
  fetchAllCollections,
  onDatabaseExpand,
}: {
  connections: SidebarConnection[];
  filter: ConnectionsFilter;
  fetchAllCollections: () => void;
  onDatabaseExpand: (connectionId: string, databaseId: string) => void;
}): UseFilteredConnectionsHookResult => {
  const [{ filtered, expanded }, dispatch] = useReducer(connectionsReducer, {
    filtered: undefined,
    expanded: {},
  });

  const activeConnections = useMemo(() => {
    return connections
      .filter(({ connectionStatus }) => {
        return connectionStatus === 'connected';
      })
      .map(({ connectionInfo }) => connectionInfo);
  }, [connections]);

  // get rid of stale connection related metadata in the state
  useEffect(() => {
    dispatch({ type: CONNECTIONS_CHANGED, connections: activeConnections });
  }, [activeConnections]);

  // filter updates
  // connections change often, but the effect only uses connections if the filter is active
  // so we use this conditional dependency to avoid too many calls
  const connectionsWhenFiltering =
    (filter.regex || filter.excludeInactive) && connections;
  useEffect(() => {
    if (!filter.regex && !filter.excludeInactive) {
      dispatch({ type: CLEAR_FILTER });
    } else if (connectionsWhenFiltering) {
      // the above check is extra just to please TS

      // When filtering, emit an event so that we can fetch all collections. This
      // is required as a workaround for the synchronous nature of the current
      // filtering feature
      fetchAllCollections();

      dispatch({
        type: FILTER_CONNECTIONS,
        connections: connectionsWhenFiltering,
        filterRegex: filter.regex,
        excludeInactive: filter.excludeInactive,
      });
    }
  }, [
    filter.regex,
    filter.excludeInactive,
    connectionsWhenFiltering,
    fetchAllCollections,
  ]);

  const onConnectionToggle = useCallback(
    (connectionId: string, expand: boolean) =>
      dispatch({ type: CONNECTION_TOGGLE, connectionId, expand }),
    []
  );

  // We are creating a ref for expanded and onDatabaseExpand because we would
  // like to keep a stable reference of onDatabaseToggle
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;
  const onDatabaseExpandRef = useRef(onDatabaseExpand);
  onDatabaseExpandRef.current = onDatabaseExpand;

  const onDatabaseToggle = useCallback(
    (connectionId: string, namespace: string, expand: boolean) => {
      const { database: databaseId } = toNS(namespace);
      if (
        expand &&
        !expandedRef.current[connectionId]?.databases?.[databaseId]
      ) {
        // side effect -> we need this to load collections
        onDatabaseExpandRef.current(connectionId, databaseId);
      }
      dispatch({ type: DATABASE_TOGGLE, connectionId, databaseId, expand });
    },
    []
  );

  const onCollapseAll = useCallback(() => {
    dispatch({ type: COLLAPSE_ALL, connections: activeConnections });
  }, [activeConnections]);

  const expandedMemo: ConnectionsNavigationTreeProps['expanded'] =
    useMemo(() => {
      const result: Record<string, false | Record<string, boolean>> = {};
      for (const { connectionInfo, connectionStatus } of connections) {
        if (connectionStatus !== 'connected') {
          result[connectionInfo.id] = false;
          continue;
        }

        const expandedItemsInConnection: Record<string, boolean> = {};
        const { state: expandedState, databases: expandedDatabases } = expanded[
          connectionInfo.id
        ] ?? { databases: {} };

        for (const dbId in expandedDatabases) {
          expandedItemsInConnection[dbId] = !!expandedDatabases[dbId];
        }

        result[connectionInfo.id] =
          expandedState !== 'collapsed' ? expandedItemsInConnection : false;
      }
      return result;
    }, [expanded, connections]);

  // This is done to strip the isMatch that we attach on filtered items
  const filteredMemo = useMemo(() => {
    if (!filtered) {
      return undefined;
    }
    return filteredConnectionsToSidebarConnection(filtered);
  }, [filtered]);

  return {
    filtered: filteredMemo,
    expanded: expandedMemo,
    onCollapseAll,
    onConnectionToggle,
    onDatabaseToggle,
  };
};
