import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { connect } from 'react-redux';
import {
  type Connection,
  type Actions,
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
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import NavigationItemsFilter from '../../navigation-items-filter';
import { findCollection } from '../../../helpers/find-collection';
import {
  fetchAllCollections,
  onDatabaseExpand,
} from '../../../modules/databases';

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

type Collection = Connection['databases'][number]['collections'][number];

type Database = Connection['databases'][number];

type FilteredCollection = Collection & Match;
type FilteredDatabase = Omit<Database, 'collections'> &
  Match & {
    collections: FilteredCollection[];
  };
type FilteredConnection = Omit<Connection, 'databases'> &
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
  connections: Connection[],
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
 * Take the starting expandedConnections, and add 'tempExpanded' to collapsed items that:
 * - are included in the filterResults
 * - their children are a match
 */
const applyTempExpanded = (
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
 * Reverts 'applyTempExpanded', bringing the items back to collapsed state
 */
const clearTempExpanded = (
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

export function ActiveConnectionNavigation({
  activeConnections,
  filterRegex,
  onFilterChange,
  connections,
  activeWorkspace,
  onNamespaceAction: _onNamespaceAction,
  fetchAllCollections: _fetchAllCollections,
  onDatabaseExpand: _onDatabaseExpand,
  onOpenConnectionInfo,
  onCopyConnectionString,
  onToggleFavoriteConnection,
  onDisconnect,
  ...navigationProps
}: Omit<
  React.ComponentProps<typeof ConnectionsNavigationTree>,
  | 'isReadOnly'
  | 'isReady'
  | 'connections'
  | 'expanded'
  | 'onConnectionExpand'
  | 'onDatabaseExpand'
> & {
  activeConnections: ConnectionInfo[];
  filterRegex: RegExp | null;
  onFilterChange: (regex: RegExp | null) => void;
  connections: Connection[];
  isDataLake?: boolean;
  isWritable?: boolean;
  activeWorkspace?: WorkspaceTab;
  onOpenConnectionInfo: (connectionId: ConnectionInfo['id']) => void;
  onCopyConnectionString: (connectionId: ConnectionInfo['id']) => void;
  onToggleFavoriteConnection: (connectionId: ConnectionInfo['id']) => void;
  onDatabaseExpand: (
    connectionId: ConnectionInfo['id'],
    databaseId: string
  ) => void;
  onDisconnect: (connectionId: ConnectionInfo['id']) => void;
  fetchAllCollections: () => void;
}): React.ReactElement {
  const [expandedConnections, setExpandedConnections] =
    useState<ExpandedConnections>({});
  const [filteredConnections, setFilteredConnections] = useState<
    Connection[] | undefined
  >(undefined);

  const {
    openDatabasesWorkspace,
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
    openPerformanceWorkspace,
  } = useOpenWorkspace();

  const temporarilyExpand = useCallback(
    (filterResults: FilteredConnection[]) => {
      setExpandedConnections((expandedConnections) => {
        const expandedStart = clearTempExpanded(expandedConnections);
        return applyTempExpanded(expandedStart, filterResults);
      });
    },
    [setExpandedConnections]
  );

  const collapseAllTemporarilyExpanded = useCallback(() => {
    setExpandedConnections(clearTempExpanded);
  }, [setExpandedConnections]);

  // filter updates
  // connections change often, but the effect only uses connections if the filter is active
  // so we use this conditional dependency to avoid too many calls
  const connectionsButOnlyIfFilterIsActive = filterRegex && connections;
  useEffect(() => {
    if (!filterRegex) {
      setFilteredConnections(undefined);
      collapseAllTemporarilyExpanded();
    } else if (connectionsButOnlyIfFilterIsActive) {
      // the above check is extra just to please TS

      // When filtering, emit an event so that we can fetch all collections. This
      // is required as a workaround for the synchronous nature of the current
      // filtering feature
      _fetchAllCollections();

      const results = filterConnections(
        connectionsButOnlyIfFilterIsActive,
        filterRegex
      );
      setFilteredConnections(results);
      temporarilyExpand(results);
    }
  }, [
    filterRegex,
    connectionsButOnlyIfFilterIsActive,
    setFilteredConnections,
    temporarilyExpand,
    collapseAllTemporarilyExpanded,
    _fetchAllCollections,
  ]);

  const onConnectionToggle = useCallback(
    (connectionId: string, forceExpand: boolean) => {
      if (
        !forceExpand &&
        expandedConnections[connectionId]?.state !== 'collapsed'
      ) {
        setExpandedConnections((expandedConnections) => ({
          ...expandedConnections,
          [connectionId]: {
            ...expandedConnections[connectionId],
            state: 'collapsed',
          },
        }));
      } else if (forceExpand && expandedConnections[connectionId]) {
        setExpandedConnections((expandedConnections) => ({
          ...expandedConnections,
          [connectionId]: {
            ...expandedConnections[connectionId],
            state: undefined,
          },
        }));
      }
    },
    [setExpandedConnections, expandedConnections]
  );

  const onDatabaseToggle = useCallback(
    (connectionId: string, namespace: string, forceExpand: boolean) => {
      const { database: databaseId } = toNS(namespace);
      if (
        !forceExpand &&
        !!expandedConnections[connectionId]?.databases[databaseId]
      ) {
        setExpandedConnections((expandedConnections) => ({
          ...expandedConnections,
          [connectionId]: {
            ...expandedConnections[connectionId],
            databases: {
              ...(expandedConnections[connectionId]?.databases || {}),
              [databaseId]: undefined,
            },
          },
        }));
      } else if (
        forceExpand &&
        !expandedConnections[connectionId]?.databases[databaseId]
      ) {
        setExpandedConnections((expandedConnections) => ({
          ...expandedConnections,
          [connectionId]: {
            ...expandedConnections[connectionId],
            databases: {
              ...(expandedConnections[connectionId]?.databases || {}),
              [databaseId]: 'expanded',
            },
          },
        }));
        _onDatabaseExpand(connectionId, databaseId);
      }
    },
    [setExpandedConnections, expandedConnections, _onDatabaseExpand]
  );

  const getExpanded = useCallback(
    (list: Connection[]) => {
      const result = list.reduce(
        (obj, { connectionInfo: { id: connectionId } }) => {
          obj[connectionId] =
            expandedConnections[connectionId]?.state !== 'collapsed'
              ? Object.fromEntries(
                  Object.entries(
                    expandedConnections[connectionId]?.databases || {}
                  ).map(([dbId, dbState]) => [dbId, !!dbState])
                )
              : false;
          return obj;
        },
        {} as Record<string, false | Record<string, boolean>>
      );
      return result;
    },
    [expandedConnections]
  );

  const expandedMemo = useMemo(
    () =>
      filteredConnections
        ? getExpanded(filteredConnections)
        : getExpanded(connections),
    [getExpanded, filteredConnections, connections]
  );

  useEffect(() => {
    // cleanup connections that are no longer active
    // if the user connects again, the new connection should start in the default state
    setExpandedConnections((expandedConnections) => {
      const newExpanded = Object.fromEntries(
        activeConnections.map(
          ({ id: connectionId }): [string, ExpandedConnections[string]] => [
            connectionId,
            expandedConnections[connectionId] || {
              state: undefined,
              databases: {},
            },
          ]
        )
      );
      return newExpanded;
    });
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

  const onNamespaceAction = useCallback(
    (connectionId: string, ns: string, action: Actions) => {
      switch (action) {
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
            connections.find((conn) => conn.connectionInfo.id === connectionId)
              ?.databases ?? []
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
    },
    [
      connections,
      openCollectionsWorkspace,
      openCollectionWorkspace,
      openPerformanceWorkspace,
      openEditViewWorkspace,
      onCopyConnectionString,
      onOpenConnectionInfo,
      onToggleFavoriteConnection,
      onDisconnect,
      _onNamespaceAction,
    ]
  );

  return (
    <div className={activeConnectionsContainerStyles}>
      <header className={activeConnectionListHeaderStyles}>
        <Subtitle className={activeConnectionListHeaderTitleStyles}>
          Active connections
          {activeConnections.length !== 0 && (
            <span className={activeConnectionCountStyles}>
              ({activeConnections.length})
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
        isReady={true}
        connections={filteredConnections || connections}
        activeWorkspace={activeWorkspace}
        onNamespaceAction={onNamespaceAction}
        onConnectionSelect={(connectionId) =>
          openDatabasesWorkspace(connectionId)
        }
        onConnectionExpand={onConnectionToggle}
        onDatabaseExpand={onDatabaseToggle}
        expanded={expandedMemo}
        {...navigationProps}
      />
    </div>
  );
}

function mapStateToProps(
  state: RootState,
  {
    activeConnections,
  }: { activeConnections: ConnectionInfo[]; filterRegex: RegExp | null }
): {
  isReady: boolean;
  connections: Connection[];
} {
  const connections: Connection[] = [];

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
      databasesStatus: status as Connection['databasesStatus'],
      databases,
      databasesLength: databases.length,
    });
  }

  return {
    isReady: true,
    connections,
  };
}

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

export default connect(mapStateToProps, {
  onNamespaceAction,
  fetchAllCollections,
  onDatabaseExpand,
})(ActiveConnectionNavigation);
