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
import type { DatabasesAction } from '../../../modules/databases';
import {
  type Database,
  toggleDatabaseExpanded,
  changeFilterRegex as changeDatabaseFilterRegex,
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
  expandedDatabases,
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
  expandedDatabases: Record<
    ConnectionInfo['id'],
    Record<string, boolean> | false
  >;
  activeWorkspace?: WorkspaceTab;
  onOpenConnectionInfo: (connectionId: ConnectionInfo['id']) => void;
  onCopyConnectionString: (connectionId: ConnectionInfo['id']) => void;
  onToggleFavoriteConnection: (connectionId: ConnectionInfo['id']) => void;
  onDisconnect: (connectionId: ConnectionInfo['id']) => void;
  onDatabaseFilterChanged: (
    filterRegex: RegExp | null
  ) => SidebarThunkAction<void, DatabasesAction>;
}): React.ReactElement {
  const [expandedConnections, setExpandedConnections] = useState<
    Record<ConnectionInfo['id'], 'collapsed' | 'tempExpanded' | undefined>
  >({});
  const [filteredConnections, setFilteredConnections] = useState<
    Connection[] | undefined
  >(undefined);
  const [filterRegex, setFilterRegex] = useState<RegExp | null>(null); // TODO: unify all filterRegex -> in redux they are per connection atm

  const {
    openDatabasesWorkspace,
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
    openPerformanceWorkspace,
  } = useOpenWorkspace();

  const temporarilyExpand = useCallback(
    (list: Connection[]) => {
      setExpandedConnections((expandedConnections) => {
        const newExpanded = { ...expandedConnections };
        list.forEach(({ connectionInfo: { id: connectionId } }) => {
          if (expandedConnections[connectionId] === 'collapsed') {
            newExpanded[connectionId] = 'tempExpanded';
          }
        });
        return newExpanded;
      });
    },
    [setExpandedConnections]
  );

  const collapseAllTemporarilyExpanded = useCallback(() => {
    setExpandedConnections((expandedConnections) => {
      const newExpanded = Object.fromEntries(
        Object.entries(expandedConnections).map(([connectionId, state]) => [
          connectionId,
          state === 'tempExpanded' ? 'collapsed' : state,
        ])
      );
      return newExpanded;
    });
  }, [setExpandedConnections]);

  useEffect(() => {
    if (!filterRegex) {
      setFilteredConnections(undefined);
      collapseAllTemporarilyExpanded();
    } else {
      const matches: Connection[] = [];
      connections.forEach((connection) => {
        if (connection.databases.length || filterRegex?.test(connection.name)) {
          matches.push(connection);
        }
      });
      setFilteredConnections(matches);
      temporarilyExpand(matches);
    }
  }, [
    filterRegex,
    connections,
    setFilteredConnections,
    temporarilyExpand,
    collapseAllTemporarilyExpanded,
  ]);

  const onConnectionToggle = useCallback(
    (connectionId: string, forceExpand: boolean) => {
      if (!forceExpand && expandedConnections[connectionId] !== 'collapsed') {
        setExpandedConnections((expandedConnections) => ({
          ...expandedConnections,
          [connectionId]: 'collapsed',
        }));
      } else if (forceExpand && expandedConnections[connectionId]) {
        setExpandedConnections((expandedConnections) => ({
          ...expandedConnections,
          [connectionId]: undefined,
        }));
      }
    },
    [setExpandedConnections, expandedConnections]
  );

  const getExpanded = useCallback(
    (list: Connection[]) => {
      const result = list.reduce(
        (obj, { connectionInfo: { id: connectionId } }) => {
          obj[connectionId] =
            expandedConnections[connectionId] !== 'collapsed'
              ? expandedDatabases[connectionId]
              : false;
          return obj;
        },
        {} as Record<string, false | Record<string, boolean>>
      );
      return result;
    },
    [expandedConnections, expandedDatabases]
  );

  useEffect(() => {
    // cleanup connections that are no longer active
    // if the user connects again, the new connection should start in the default state
    setExpandedConnections((expandedConnections) => {
      const newExpanded = Object.fromEntries(
        activeConnections.map(({ connectionOptions: { id: connectionId } }) => [
          connectionId,
          expandedConnections[connectionId],
        ])
      );
      return newExpanded;
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
        connections={filteredConnections || connections}
        activeWorkspace={activeWorkspace}
        onNamespaceAction={onNamespaceAction}
        onConnectionSelect={(connectionId) =>
          openDatabasesWorkspace(connectionId)
        }
        onConnectionExpand={onConnectionToggle}
        onDatabaseExpand={onDatabaseExpand}
        expanded={
          filteredConnections
            ? getExpanded(filteredConnections)
            : getExpanded(connections)
        }
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
  expandedDatabases: Record<string, Record<string, boolean> | false>;
} {
  const connections: Connection[] = [];
  const expandedResult: Record<string, any> = {};

  for (const connectionInfo of activeConnections) {
    const connectionId = connectionInfo.id;
    const instance = state.instance[connectionId];
    const filterRegex = state.databases.filterRegex;
    const { filteredDatabases, expandedDbList: initialExpandedDbList } =
      state.databases.connectionDatabases[connectionId] || {};

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
    expandedDatabases: expandedResult,
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
          getState().databases.connectionDatabases[connectionId].databases
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
