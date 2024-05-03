import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  type Database,
  toggleDatabaseExpanded,
  changeFilterRegex as changeDatabaseFilterRegex,
  DatabasesAction,
} from '../../../modules/databases';
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
import { filter } from 'lodash';

function findCollection(ns: string, databases: Database[]) {
  const { database, collection } = toNS(ns);

  return (
    databases
      .find((db) => db._id === database)
      ?.collections.find((coll) => coll.name === collection) ?? null
  );
}

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

export function ActiveConnectionNavigation({
  activeConnections,
  connections,
  expanded,
  activeWorkspace,
  onNamespaceAction: _onNamespaceAction,
  onOpenConnectionInfo,
  onCopyConnectionString,
  onToggleFavoriteConnection,
  onDatabaseExpand,
  onDisconnect,
  onDatabaseFilterChanged,
  ...navigationProps
}: Omit<
  React.ComponentProps<typeof ConnectionsNavigationTree>,
  | 'isReadOnly'
  | 'databases'
  | 'connections'
  | 'expanded'
  | 'onConnectionExpand'
  | 'isReady'
> & {
  activeConnections: ConnectionInfo[];
  connections: Connection[];
  isDataLake?: boolean;
  isWritable?: boolean;
  expanded: Record<string, Record<string, boolean> | false>;
  activeWorkspace?: WorkspaceTab;
  onOpenConnectionInfo: (connectionId: ConnectionInfo['id']) => void;
  onCopyConnectionString: (connectionId: ConnectionInfo['id']) => void;
  onToggleFavoriteConnection: (connectionId: ConnectionInfo['id']) => void;
  onDisconnect: (connectionId: ConnectionInfo['id']) => void;
  onDatabaseFilterChanged: (
    filterRegex: RegExp | null
  ) => SidebarThunkAction<void, DatabasesAction>;
}): React.ReactElement {
  const [collapsed, setCollapsed] = useState<ConnectionInfo['id'][]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>(
    []
  );
  const [filterRegex, setFilterRegex] = useState<RegExp | null>(null); // TODO: unify all filterRegex -> in redux they are per connection atm

  const {
    openDatabasesWorkspace,
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
    openPerformanceWorkspace,
  } = useOpenWorkspace();

  useEffect(() => {
    if (!filterRegex) {
      setFilteredConnections(connections);
    } else {
      // TODO: anything that contains a match is a match AND should be expanded
      const matches: Connection[] = [];
      connections.forEach((connection) => {
        console.log({ connection });
        if (connection.databases.length || filterRegex?.test(connection.name)) {
          matches.push(connection);
        }
        if (
          connection.databases.length &&
          collapsed.includes(connection.connectionInfo.id)
        ) {
          setCollapsed((collapsed) => {
            const index = collapsed.indexOf(connection.connectionInfo.id);
            return [
              ...collapsed.slice(0, index),
              ...collapsed.slice(index + 1),
            ];
          });
        }
      });
      console.log({ matches, filterRegex });
      setFilteredConnections(matches);
    }
  }, [filterRegex, connections, setFilteredConnections, setCollapsed]);

  const onConnectionToggle = useCallback(
    (connectionId: string, forceExpand: boolean) => {
      if (!forceExpand && !collapsed.includes(connectionId))
        setCollapsed((collapsed) => [...collapsed, connectionId]);
      else if (forceExpand && collapsed.includes(connectionId)) {
        setCollapsed((collapsed) => {
          const index = collapsed.indexOf(connectionId);
          return [...collapsed.slice(0, index), ...collapsed.slice(index + 1)];
        });
      }
    },
    [setCollapsed, collapsed]
  );

  useEffect(() => {
    // cleanup connections that are no longer active
    // if the user connects again, the new connection should be expanded again
    setCollapsed((collapsed) => {
      const newCollapsed = activeConnections
        .filter(({ id }: ConnectionInfo) => collapsed.includes(id))
        .map(({ id }: ConnectionInfo) => id);
      return newCollapsed;
    });
  }, [activeConnections]);

  const onConnectionToggleRef = useRef(onConnectionToggle);
  onConnectionToggleRef.current = onConnectionToggle;
  // auto-expanding on a workspace change
  useEffect(() => {
    if (
      activeWorkspace &&
      (activeWorkspace.type === 'Databases' ||
        activeWorkspace.type === 'Collections' ||
        activeWorkspace.type === 'Collection')
    ) {
      const connectionId: string = activeWorkspace.connectionId;
      // we're using a ref for this toggle because collapsing depends on the collapsed state,
      // but we don't want to auto-expand when collapsed state changes, only workspace
      onConnectionToggleRef.current(connectionId, true);

      if (activeWorkspace.type !== 'Databases') {
        const namespace: string = activeWorkspace.namespace;
        onDatabaseExpand(connectionId, namespace, true);
      }
    }
  }, [activeWorkspace, onDatabaseExpand]);

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
            (connections.find((conn) => conn.connectionInfo.id === connectionId)
              ?.databases as Database[]) ?? []
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

  const onFilterChange = useCallback(
    (filterRegex: RegExp | null) => {
      setFilterRegex(filterRegex);
      onDatabaseFilterChanged(filterRegex);
    },
    [onDatabaseFilterChanged]
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
        connections={filteredConnections}
        activeWorkspace={activeWorkspace}
        onNamespaceAction={onNamespaceAction}
        onConnectionSelect={(connectionId) =>
          openDatabasesWorkspace(connectionId)
        }
        onConnectionExpand={onConnectionToggle}
        onDatabaseExpand={onDatabaseExpand}
        expanded={filteredConnections.reduce(
          (obj, { connectionInfo: { id: connectionId } }) => {
            obj[connectionId] = collapsed.includes(connectionId)
              ? false
              : expanded[connectionId];
            return obj;
          },
          {} as Record<string, false | Record<string, boolean>>
        )}
        {...navigationProps}
      />
    </div>
  );
}

function mapStateToProps(
  state: RootState,
  { activeConnections }: { activeConnections: ConnectionInfo[] }
): {
  isReady: boolean;
  connections: Connection[];
  expanded: Record<string, Record<string, boolean> | false>;
} {
  const connections: Connection[] = [];
  const expandedResult: Record<string, any> = {};

  for (const connectionInfo of activeConnections) {
    const connectionId = connectionInfo.id;
    const instance = state.instance[connectionId];
    const {
      filterRegex,
      filteredDatabases,
      expandedDbList: initialExpandedDbList,
    } = state.databases[connectionId] || {};

    const status = instance?.databasesStatus;
    const isReady =
      status !== undefined && !['initial', 'fetching'].includes(status);
    const defaultExpanded = Boolean(filterRegex);

    const expandedDbList = initialExpandedDbList ?? {};
    const expanded = Object.fromEntries(
      ((filteredDatabases as any[]) || []).map(({ name }) => [
        name,
        expandedDbList[name] ?? defaultExpanded,
      ])
    );

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
      databasesLength: filteredDatabases?.length ?? 0,
      databasesStatus: status as Connection['databasesStatus'],
      databases: filteredDatabases ?? [],
    });

    expandedResult[connectionId] = expanded;
  }

  return {
    isReady: true,
    connections,
    expanded: expandedResult,
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
  onDatabaseExpand: toggleDatabaseExpanded,
  onDatabaseFilterChanged: changeDatabaseFilterRegex,
  onNamespaceAction,
})(ActiveConnectionNavigation);
