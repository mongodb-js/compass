import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  type MapDispatchToProps,
  type MapStateToProps,
  connect,
} from 'react-redux';
import {
  type Actions,
  type SidebarActionableItem,
  type ConnectedConnection,
  ConnectionsNavigationTree,
} from '@mongodb-js/compass-connections-navigation';
import {
  type ConnectionInfo,
  getConnectionTitle,
} from '@mongodb-js/connection-info';
import toNS from 'mongodb-ns';
import type { RootState, SidebarThunkAction } from '../../../modules';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  Subtitle,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import NavigationItemsFilter from '../../navigation-items-filter';
import { findCollection } from '../../../helpers/find-collection';
import {
  fetchAllCollections,
  onDatabaseExpand,
} from '../../../modules/databases';
import type { ConnectionsNavigationTreeProps } from '@mongodb-js/compass-connections-navigation/dist/connections-navigation-tree';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';

type ExpandedDatabases = Record<
  Database['_id'],
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

type Collection = ConnectedConnection['databases'][number]['collections'][number];

type Database = ConnectedConnection['databases'][number];

type FilteredCollection = Collection & Match;
type FilteredDatabase = Omit<Database, 'collections'> &
  Match & {
    collections: FilteredCollection[];
  };
type FilteredConnection = Omit<ConnectedConnection, 'databases'> &
  Match & {
    databases: FilteredDatabase[];
  };

const activeConnectionsContainerStyles = css({
  height: '100%',
  padding: `${spacing[2]}px ${spacing[3]}px`,
  borderTop: `1px solid ${palette.gray.light2}`,
});

const activeConnectionListHeaderStyles = css({
  flexGrow: 0,
  display: 'flex',
  flexDirection: 'row',
  alignContent: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing[200],
});

const searchInputStyles = css({
  marginBottom: spacing[200],
});

const activeConnectionListHeaderTitleStyles = css({
  marginTop: 0,
  marginBottom: 0,
  textTransform: 'uppercase',
  fontSize: '12px',
});

const activeConnectionCountStyles = css({
  fontWeight: 'normal',
  marginLeft: spacing[100],
});

const filterConnections = (
  connections: ConnectedConnection[],
  regex: RegExp
): FilteredConnection[] => {
  const results: FilteredConnection[] = [];
  for (const connection of connections) {
    const isMatch = regex.test(connection.name);
    const childMatches = filterDatabases(connection.databases, regex);

    if (isMatch || childMatches.length) {
      results.push({
        ...connection,
        isMatch,
        databases: childMatches.length ? childMatches : connection.databases,
      });
    }
  }
  return results;
};

const filterDatabases = (
  databases: Database[],
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
  collections: Collection[],
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
  filterResults.forEach(
    ({ connectionInfo: { id: connectionId }, databases }) => {
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
  );
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
  filtered: ConnectedConnection[] | undefined;
}

const FILTER_CONNECTIONS =
  'sidebar/active-connections/FILTER_CONNECTIONS' as const;
interface FilterConnectionsAction {
  type: typeof FILTER_CONNECTIONS;
  connections: ConnectedConnection[];
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
              ...state.expanded[connectionId].databases,
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

type ActiveConnectionNavigationComponentProps = Pick<
  React.ComponentProps<typeof ConnectionsNavigationTree>,
  'activeWorkspace'
> & {
  activeConnections: ConnectionInfo[];
  filterRegex: RegExp | null;
  onFilterChange(regex: RegExp | null): void;
  onOpenConnectionInfo(connectionId: ConnectionInfo['id']): void;
  onCopyConnectionString(connectionId: ConnectionInfo['id']): void;
  onToggleFavoriteConnection(connectionId: ConnectionInfo['id']): void;
  onDisconnect(connectionId: ConnectionInfo['id']): void;
};

type MapStateProps = {
  connections: ConnectedConnection[];
};

type MapDispatchProps = {
  fetchAllCollections(): void;
  onNamespaceAction(
    connectionId: ConnectionInfo['id'],
    namespace: string,
    action: Actions
  ): void;
  onDatabaseExpand(
    connectionId: ConnectionInfo['id'],
    databaseId: string,
  ): void;
};

type ActiveConnectionNavigationProps =
  ActiveConnectionNavigationComponentProps & MapStateProps & MapDispatchProps;

export function ActiveConnectionNavigation({
  connections,
  activeWorkspace,
  activeConnections,
  onOpenConnectionInfo,
  onCopyConnectionString,
  onToggleFavoriteConnection,
  onDisconnect,
  filterRegex,
  onFilterChange,
  onNamespaceAction: _onNamespaceAction,
  fetchAllCollections: _fetchAllCollections,
  onDatabaseExpand: _onDatabaseExpand,
}: ActiveConnectionNavigationProps): React.ReactElement {
  const {
    openShellWorkspace,
    openDatabasesWorkspace,
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
    openPerformanceWorkspace,
  } = useOpenWorkspace();

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

  useEffect(() => {
    dispatch({ type: CONNECTIONS_CHANGED, connections: activeConnections });
  }, [activeConnections]);

  // we're using a ref for this toggle because collapsing depends on the collapsed state,
  // but we don't want to auto-expand when collapsed state changes, only workspace
  const onConnectionToggleRef = useRef(onConnectionToggle);
  onConnectionToggleRef.current = onConnectionToggle;
  const onDatabaseToggleRef = useRef(onDatabaseToggle);
  onDatabaseToggleRef.current = onDatabaseToggle;
  // auto-expanding on a workspace change
  useEffect(() => {
    if (
      activeWorkspace &&
      (activeWorkspace.type === 'Databases' ||
        activeWorkspace.type === 'Collections' ||
        activeWorkspace.type === 'Collection')
    ) {
      const connectionId: string = activeWorkspace.connectionId;
      onConnectionToggleRef.current(connectionId, true);

      if (activeWorkspace.type !== 'Databases') {
        const namespace: string = activeWorkspace.namespace;
        onDatabaseToggleRef.current(connectionId, namespace, true);
      }
    }
  }, [activeWorkspace]);

  const onConnectionAction = useCallback(
    (connectionId: string, action: Actions) => {
      switch (action) {
        case 'open-shell':
          openShellWorkspace(connectionId, { newTab: true });
          return;
        case 'select-connection':
          openDatabasesWorkspace(connectionId);
          return;
        case 'connection-disconnect':
          onDisconnect(connectionId);
          return;
        case 'open-connection-info':
          onOpenConnectionInfo(connectionId);
          return;
        case 'copy-connection-string':
          onCopyConnectionString(connectionId);
          return;
        case 'connection-toggle-favorite':
          onToggleFavoriteConnection(connectionId);
          return;
        case 'connection-performance-metrics':
          openPerformanceWorkspace(connectionId);
          return;
      }
    },
    [
      onDisconnect,
      onOpenConnectionInfo,
      onCopyConnectionString,
      onToggleFavoriteConnection,
      openPerformanceWorkspace,
      openDatabasesWorkspace,
      openShellWorkspace,
    ]
  );

  const onItemAction = useCallback(
    (item: SidebarActionableItem, action: Actions) => {
      if (item.type === 'connection') {
        onConnectionAction(item.connectionInfo.id, action);
        return;
      } else {
        const { connectionId } = item;
        const ns = item.type === 'database' ? item.dbName : item.namespace;
        switch (action) {
          case 'select-database':
            openCollectionsWorkspace(connectionId, ns);
            return;
          case 'select-collection':
            openCollectionWorkspace(connectionId, ns);
            return;
          case 'open-in-new-tab':
            openCollectionWorkspace(connectionId, ns, { newTab: true });
            return;
          case 'modify-view': {
            const coll = findCollection(
              ns,
              (connections.find(
                (conn) => conn.connectionInfo.id === connectionId
              )?.databases as Database[]) ?? []
            );
            if (coll && coll.sourceName && coll.pipeline) {
              openEditViewWorkspace(connectionId, coll._id, {
                sourceName: coll.sourceName,
                sourcePipeline: coll.pipeline,
                newTab: true,
              });
            }
            return;
          }
          default:
            _onNamespaceAction(connectionId, ns, action);
            return;
        }
      }
    },
    [
      onConnectionAction,
      connections,
      openCollectionsWorkspace,
      openCollectionWorkspace,
      openEditViewWorkspace,
      _onNamespaceAction,
    ]
  );

  const onItemExpand = useCallback(
    (item: SidebarActionableItem, isExpanded: boolean) => {
      if (item.type === 'connection') {
        onConnectionToggle(item.connectionInfo.id, isExpanded);
      } else if (item.type === 'database') {
        onDatabaseToggle(item.connectionId, item.dbName, isExpanded);
      }
    },
    [onConnectionToggle, onDatabaseToggle]
  );

  return (
    <div className={activeConnectionsContainerStyles}>
      <header className={activeConnectionListHeaderStyles}>
        <Subtitle className={activeConnectionListHeaderTitleStyles}>
          Active connections
          {connections.length !== 0 && (
            <span className={activeConnectionCountStyles}>
              ({connections.length})
            </span>
          )}
        </Subtitle>
      </header>
      <NavigationItemsFilter
        placeholder="Search active connections"
        searchInputClassName={searchInputStyles}
        onFilterChange={onFilterChange}
      />
      <ConnectionsNavigationTree
        connections={filtered || connections}
        activeWorkspace={activeWorkspace}
        expanded={expandedMemo}
        onItemAction={onItemAction}
        onItemExpand={onItemExpand}
      />
    </div>
  );
}

const mapStateToProps: MapStateToProps<
  MapStateProps,
  ActiveConnectionNavigationComponentProps,
  RootState
> = (
  state: RootState,
  { activeConnections }
) => {
  const connections: ConnectedConnection[] = [];

  for (const connectionInfo of activeConnections) {
    const connectionId = connectionInfo.id;
    const instance = state.instance[connectionId];
    const { databases } = state.databases[connectionId] || {};

    const status = instance?.databasesStatus;
    const isReady =
      status !== undefined && !['initial', 'fetching'].includes(status);

    const isDataLake = instance?.dataLake?.isDataLake ?? false;
    const isWritable = instance?.isWritable ?? false;

    const isPerformanceTabSupported =
      !isDataLake && !!state.isPerformanceTabSupported[connectionId];

    connections.push({
      isReady,
      isDataLake,
      isWritable,
      isPerformanceTabSupported,
      name: getConnectionTitle(connectionInfo),
      connectionInfo,
      databases,
      databasesLength: databases.length,
      databasesStatus: status as ConnectedConnection['databasesStatus'],
      connectionStatus: ConnectionStatus.Connected,
    });
  }

  return {
    connections,
  };
};

const onNamespaceAction = (
  connectionId: string,
  namespace: string,
  action: Actions
): SidebarThunkAction<void> => {
  return (_dispatch, getState, { globalAppRegistry }) => {
    const emit = (action: string, ...rest: any[]) => {
      globalAppRegistry.emit(action, ...rest);
    };
    const ns = toNS(namespace);
    switch (action) {
      case 'create-database':
        emit('open-create-database', { connectionId });
        return;
      case 'drop-database':
        emit('open-drop-database', ns.database, { connectionId });
        return;
      case 'rename-collection':
        emit('open-rename-collection', ns, { connectionId });
        return;
      case 'drop-collection':
        emit('open-drop-collection', ns, { connectionId });
        return;
      case 'create-collection':
        emit('open-create-collection', ns, {
          connectionId,
        });
        return;
      case 'duplicate-view': {
        const coll = findCollection(
          namespace,
          getState().databases[connectionId].databases
        );
        if (coll && coll.sourceName) {
          emit(
            'open-create-view',
            {
              source: coll.sourceName,
              pipeline: coll.pipeline,
              duplicate: true,
            },
            {
              connectionId,
            }
          );
        }
        return;
      }
      default:
      // no-op
    }
  };
};

const mapDispatchToProps: MapDispatchToProps<
  MapDispatchProps,
  ActiveConnectionNavigationComponentProps
> = {
  onDatabaseExpand,
  fetchAllCollections,
  onNamespaceAction,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActiveConnectionNavigation);
