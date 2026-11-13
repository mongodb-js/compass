import _ from 'lodash';
import toNS from '@mongodb-js/mongodb-ns';
import type {
  SidebarCollection,
  SidebarConnectedConnection,
  SidebarDatabase,
  ConnectionsNavigationTreeProps,
  SidebarConnection,
  SidebarNotConnectedConnection,
} from '@mongodb-js/compass-connections-navigation';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import type { Folder } from '@mongodb-js/connection-storage/provider';
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
type ExpandedFolders = Record<
  Folder['id'],
  'expanded' | 'tempExpanded' | undefined
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

const isConnectionInactive = (connection: SidebarConnection): boolean =>
  connection.connectionStatus !== 'connected' &&
  connection.connectionStatus !== 'connecting';

/**
 * Matches a connection, its databases and its collections against the search.
 *
 * When `includeAll` is set the connection is kept even if nothing about it
 * matches, which is what a folder that matches by name needs: it shows all of
 * its connections.
 */
const filterConnection = (
  connection: SidebarConnection,
  regex: RegExp | null,
  includeAll: boolean
): FilteredConnection | null => {
  const isMatch = !regex || regex.test(connection.name);
  let childMatches: FilteredDatabase[] = [];
  if (connection.connectionStatus === 'connected') {
    childMatches = filterDatabases(connection.databases, regex);
  }

  if (!isMatch && !childMatches.length && !includeAll) {
    return null;
  }

  return {
    ...connection,
    isMatch,
    ...(connection.connectionStatus === 'connected'
      ? {
          databases:
            isMatch || includeAll ? connection.databases : childMatches,
        }
      : {}),
  };
};

interface FilteredTree {
  connections: FilteredConnection[];
  folders: Folder[];
  temporarilyExpandedFolderIds: string[];
}

/**
 * Filters connections and folders for the search and the visible-folders
 * filter.
 *
 * A folder that matches by name keeps all of its connections; a connection
 * that matches keeps its parent folder so the match stays reachable. Folders
 * hidden by the visible-folders filter are dropped along with their
 * connections, which is what keeps the filter to "what is shown" only: the
 * folder assignments are never touched.
 */
const filterConnections = (
  connections: SidebarConnection[],
  folders: Folder[],
  folderAssignments: Record<string, string>,
  regex: RegExp | null,
  excludeInactive: boolean,
  hiddenFolderIds: string[],
  hideUncategorizedConnections: boolean
): FilteredTree => {
  const hiddenFolders = new Set(hiddenFolderIds);
  const foldersById = new Map(folders.map((folder) => [folder.id, folder]));

  // A connection whose assignment points at a folder that doesn't exist is
  // uncategorized, mirroring how the tree resolves membership.
  const resolveFolderId = (connection: SidebarConnection) => {
    const folderId = folderAssignments[connection.connectionInfo.id];
    return folderId && foldersById.has(folderId) ? folderId : undefined;
  };

  const connectionsByFolderId = new Map<string, SidebarConnection[]>();
  const uncategorized: SidebarConnection[] = [];
  for (const connection of connections) {
    if (excludeInactive && isConnectionInactive(connection)) {
      continue;
    }
    const folderId = resolveFolderId(connection);
    if (!folderId) {
      uncategorized.push(connection);
      continue;
    }
    const siblings = connectionsByFolderId.get(folderId);
    if (siblings) {
      siblings.push(connection);
    } else {
      connectionsByFolderId.set(folderId, [connection]);
    }
  }

  const filteredConnections: FilteredConnection[] = [];
  const visibleFolders: Folder[] = [];
  const temporarilyExpandedFolderIds: string[] = [];

  for (const folder of folders) {
    if (hiddenFolders.has(folder.id)) {
      continue;
    }

    const folderConnections = connectionsByFolderId.get(folder.id) ?? [];
    // A folder that matches the search by name shows all of its connections,
    // including the ones that don't match themselves.
    const nameMatches = !!regex && regex.test(folder.name);
    const connectionsToShow = folderConnections
      .map((connection) => filterConnection(connection, regex, nameMatches))
      .filter((connection): connection is FilteredConnection => !!connection);

    // Without a narrowing filter an empty folder still shows, so a folder the
    // user just created is visible. Once a search or the active-only filter is
    // on, folders with nothing left to show hide automatically.
    if (
      !nameMatches &&
      !connectionsToShow.length &&
      (regex || excludeInactive)
    ) {
      continue;
    }

    visibleFolders.push(folder);
    filteredConnections.push(...connectionsToShow);

    // Expand the folder while a search is active so its matches are visible;
    // the user's own expanded state is restored once the search is cleared.
    if (regex) {
      temporarilyExpandedFolderIds.push(folder.id);
    }
  }

  if (!hideUncategorizedConnections) {
    for (const connection of uncategorized) {
      const filtered = filterConnection(connection, regex, false);
      if (filtered) {
        filteredConnections.push(filtered);
      }
    }
  }

  return {
    connections: filteredConnections,
    folders: visibleFolders,
    temporarilyExpandedFolderIds,
  };
};

const filterDatabases = (
  databases: SidebarDatabase[],
  regex: RegExp | null
): FilteredDatabase[] => {
  const results: FilteredDatabase[] = [];
  for (const db of databases) {
    const isMatch = !regex || regex.test(db.name);
    const childMatches = filterCollections(db.collections, regex, db.name);

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
  regex: RegExp | null,
  dbName: string
): FilteredCollection[] => {
  return collections
    .filter(
      ({ name }) =>
        !regex || regex.test(name) || regex.test(`${dbName}.${name}`)
    )
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

/**
 * Temporarily expands the folders a search matched, leaving folders the user
 * expanded on their own untouched.
 */
const temporarilyExpandFolders = (
  expandedFolders: ExpandedFolders,
  folderIds: string[]
): ExpandedFolders => {
  const newExpanded = { ...expandedFolders };
  for (const folderId of folderIds) {
    if (!newExpanded[folderId]) {
      newExpanded[folderId] = 'tempExpanded';
    }
  }
  return newExpanded;
};

/**
 * Reverts 'temporarilyExpandFolders', collapsing the folders the search opened.
 */
const revertTemporaryExpandedFolders = (
  expandedFolders: ExpandedFolders
): ExpandedFolders => {
  const cleared: ExpandedFolders = {};
  for (const [folderId, state] of Object.entries(expandedFolders)) {
    cleared[folderId] = state === 'tempExpanded' ? undefined : state;
  }
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
  expandedFolders: ExpandedFolders;
  filtered: SidebarConnection[] | undefined;
  folders: Folder[] | undefined;
}

const FILTER_CONNECTIONS =
  'sidebar/active-connections/FILTER_CONNECTIONS' as const;
interface FilterConnectionsAction {
  type: typeof FILTER_CONNECTIONS;
  connections: SidebarConnection[];
  folders: Folder[];
  folderAssignments: Record<string, string>;
  filterRegex: RegExp | null;
  excludeInactive: boolean;
  hiddenFolderIds: string[];
  hideUncategorizedConnections: boolean;
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

const FOLDER_TOGGLE = 'sidebar/active-connections/FOLDER_TOGGLE' as const;
interface ToggleFolderAction {
  type: typeof FOLDER_TOGGLE;
  folderId: string;
  expand: boolean;
}

type ConnectionsAction =
  | FilterConnectionsAction
  | ClearConnectionsFilterAction
  | ToggleConnectionAction
  | ToggleDatabaseAction
  | ConnectionsChangedAction
  | CollapseAllAction
  | ToggleFolderAction;

const connectionsReducer = (
  state: ConnectionsState,
  action: ConnectionsAction
): ConnectionsState => {
  switch (action.type) {
    case COLLAPSE_ALL: {
      return {
        ...state,
        expanded: collapseAll(action.connections),
        expandedFolders: {},
      };
    }
    case FOLDER_TOGGLE: {
      const { folderId, expand } = action;
      if (!!state.expandedFolders[folderId] === expand) return state;
      return {
        ...state,
        expandedFolders: {
          ...state.expandedFolders,
          [folderId]: expand ? 'expanded' : undefined,
        },
      };
    }
    case FILTER_CONNECTIONS: {
      const {
        connections,
        folders,
        folderAssignments,
        filterRegex,
        excludeInactive,
        hiddenFolderIds,
        hideUncategorizedConnections,
      } = action;
      const {
        connections: filtered,
        folders: visibleFolders,
        temporarilyExpandedFolderIds,
      } = filterConnections(
        connections,
        folders,
        folderAssignments,
        filterRegex,
        excludeInactive,
        hiddenFolderIds,
        hideUncategorizedConnections
      );
      const persistingExpanded = revertTemporaryExpanded(state.expanded);
      const persistingFolders = revertTemporaryExpandedFolders(
        state.expandedFolders
      );
      return {
        ...state,
        filtered,
        folders: visibleFolders,
        expanded: temporarilyExpand(persistingExpanded, filtered),
        expandedFolders: temporarilyExpandFolders(
          persistingFolders,
          temporarilyExpandedFolderIds
        ),
      };
    }
    case CLEAR_FILTER:
      return {
        ...state,
        filtered: undefined,
        folders: undefined,
        expanded: revertTemporaryExpanded(state.expanded),
        expandedFolders: revertTemporaryExpandedFolders(state.expandedFolders),
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
  folders: Folder[];
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
  onFolderToggle(this: void, folderId: string, isExpanded: boolean): void;
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
  /**
   * Folder ids hidden from the tree. Folders that are not listed stay visible,
   * so a folder created while a filter is set shows up by default. The filter
   * only changes what is displayed, never which folder a connection belongs to.
   */
  hiddenFolderIds?: string[];
  /** Hide connections that are not filed in any folder. */
  hideUncategorizedConnections?: boolean;
};

const EMPTY_FOLDERS: Folder[] = [];
const EMPTY_FOLDER_ASSIGNMENTS: Record<string, string> = Object.create(null);
const EMPTY_HIDDEN_FOLDER_IDS: string[] = [];

export const useFilteredConnections = ({
  connections,
  folders = EMPTY_FOLDERS,
  folderAssignments = EMPTY_FOLDER_ASSIGNMENTS,
  filter,
  fetchAllCollections,
  onDatabaseExpand,
}: {
  connections: SidebarConnection[];
  folders?: Folder[];
  folderAssignments?: Record<string, string>;
  filter: ConnectionsFilter;
  fetchAllCollections: () => void;
  onDatabaseExpand: (connectionId: string, databaseId: string) => void;
}): UseFilteredConnectionsHookResult => {
  const [
    { filtered, folders: visibleFolders, expanded, expandedFolders },
    dispatch,
  ] = useReducer(connectionsReducer, {
    filtered: undefined,
    folders: undefined,
    expanded: {},
    expandedFolders: {},
  });

  const hiddenFolderIds = filter.hiddenFolderIds ?? EMPTY_HIDDEN_FOLDER_IDS;
  const hideUncategorizedConnections = !!filter.hideUncategorizedConnections;
  const isFilterActive =
    !!filter.regex ||
    filter.excludeInactive ||
    hiddenFolderIds.length > 0 ||
    hideUncategorizedConnections;

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
  const connectionsWhenFiltering = isFilterActive && connections;
  useEffect(() => {
    if (!isFilterActive) {
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
        folders,
        folderAssignments,
        filterRegex: filter.regex,
        excludeInactive: filter.excludeInactive,
        hiddenFolderIds,
        hideUncategorizedConnections,
      });
    }
  }, [
    isFilterActive,
    filter.regex,
    filter.excludeInactive,
    hiddenFolderIds,
    hideUncategorizedConnections,
    connectionsWhenFiltering,
    folders,
    folderAssignments,
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

  const onFolderToggle = useCallback(
    (folderId: string, expand: boolean) =>
      dispatch({ type: FOLDER_TOGGLE, folderId, expand }),
    []
  );

  // While a filter is active the tree only gets the folders that survived it;
  // otherwise it gets the full list.
  const foldersToRender = visibleFolders ?? folders;

  const expandedMemo: ConnectionsNavigationTreeProps['expanded'] =
    useMemo(() => {
      const result: Record<string, false | Record<string, boolean>> =
        Object.create(null);
      for (const { connectionInfo, connectionStatus } of connections) {
        if (connectionStatus !== 'connected') {
          result[connectionInfo.id] = false;
          continue;
        }

        const expandedItemsInConnection: Record<string, boolean> =
          Object.create(null);
        const { state: expandedState, databases: expandedDatabases } = expanded[
          connectionInfo.id
        ] ?? { databases: {} };

        for (const dbId in expandedDatabases) {
          expandedItemsInConnection[dbId] = !!expandedDatabases[dbId];
        }

        result[connectionInfo.id] =
          expandedState !== 'collapsed' ? expandedItemsInConnection : false;
      }
      for (const { id } of foldersToRender) {
        result[id] = expandedFolders[id] ? Object.create(null) : false;
      }
      return result;
    }, [expanded, connections, foldersToRender, expandedFolders]);

  // This is done to strip the isMatch that we attach on filtered items
  const filteredMemo = useMemo(() => {
    if (!filtered) {
      return undefined;
    }
    return filteredConnectionsToSidebarConnection(filtered);
  }, [filtered]);

  return {
    filtered: filteredMemo,
    folders: foldersToRender,
    expanded: expandedMemo,
    onCollapseAll,
    onConnectionToggle,
    onDatabaseToggle,
    onFolderToggle,
  };
};
