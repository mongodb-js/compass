import toNS from 'mongodb-ns';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Subtitle, css, spacing } from '@mongodb-js/compass-components';
import { ConnectionsNavigationTree } from '@mongodb-js/compass-connections-navigation';
import type { MapDispatchToProps, MapStateToProps } from 'react-redux';
import type {
  Actions,
  SidebarConnectedConnection,
  SidebarConnectedConnectionTreeItem,
  SidebarConnection,
  SidebarNotConnectedConnectionTreeItem,
  SidebarItem,
} from '@mongodb-js/compass-connections-navigation';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import type { RootState, SidebarThunkAction } from '../../modules';
import {
  ConnectionStatus,
  useConnectionsManagerContext,
} from '@mongodb-js/compass-connections/provider';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  onDatabaseExpand,
  fetchAllCollections,
  type Database,
} from '../../modules/databases';
import { useFilteredConnections } from '../use-filtered-connections';
import NavigationItemsFilter from '../navigation-items-filter';

const connectionsContainerStyles = css({
  height: '100%',
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  paddingBottom: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const activeConnectionListHeaderTitleStyles = css({
  marginTop: 0,
  marginBottom: 0,
  textTransform: 'uppercase',
  fontSize: '12px',
  lineHeight: `${spacing[800]}px`,
});

const activeConnectionCountStyles = css({
  fontWeight: 'normal',
  marginLeft: spacing[100],
});

function findCollection(ns: string, databases: Database[]) {
  const { database, collection } = toNS(ns);

  return (
    databases
      .find((db) => db._id === database)
      ?.collections.find((coll) => coll.name === collection) ?? null
  );
}

type UnifiedConnectionsNavigationComponentProps = {
  favoriteConnections: ConnectionInfo[];
  recentConnections: ConnectionInfo[];
  activeWorkspace: WorkspaceTab | null;
  filterRegex: RegExp | null;
  onFilterChange(regex: RegExp | null): void;
  onConnect(info: ConnectionInfo): void;
  onEditConnection(info: ConnectionInfo): void;
  onRemoveConnection(info: ConnectionInfo): void;
  onDuplicateConnection(info: ConnectionInfo): void;
  onCopyConnectionString(info: ConnectionInfo, isActive: boolean): void;
  onToggleFavoriteConnectionInfo(info: ConnectionInfo, isActive: boolean): void;

  onOpenConnectionInfo(id: string): void;
  onDisconnect(id: string): void;
};

type MapStateProps = {
  instances: RootState['instance'];
  databases: RootState['databases'];
  isPerformanceTabSupported: RootState['isPerformanceTabSupported'];
};

type MapDispatchProps = {
  fetchAllCollections(): void;
  onDatabaseExpand(connectionId: string, dbId: string): void;
  onNamespaceAction(
    connectionId: string,
    namespace: string,
    action: Actions
  ): void;
};

type UnifiedConnectionsNavigationProps =
  UnifiedConnectionsNavigationComponentProps & MapStateProps & MapDispatchProps;

const UnifiedConnectionsNavigation: React.FC<
  UnifiedConnectionsNavigationProps
> = ({
  favoriteConnections,
  recentConnections,
  activeWorkspace,
  filterRegex,
  instances,
  databases,
  isPerformanceTabSupported,
  onFilterChange,
  onConnect,
  onEditConnection,
  onRemoveConnection,
  onDuplicateConnection,
  onCopyConnectionString,
  onToggleFavoriteConnectionInfo,

  onOpenConnectionInfo,
  onDisconnect,
  onDatabaseExpand,
  fetchAllCollections,
  onNamespaceAction: _onNamespaceAction,
}) => {
  const {
    openPerformanceWorkspace,
    openDatabasesWorkspace,
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
  } = useOpenWorkspace();
  const connectionsManager = useConnectionsManagerContext();
  const connections = useMemo(() => {
    const connections: SidebarConnection[] = [];
    const sortedFavoriteConnections = _.sortBy(favoriteConnections, 'name');
    const sortedRecentConnections = _.sortBy(recentConnections, 'name');

    for (const connection of [
      ...sortedFavoriteConnections,
      ...sortedRecentConnections,
    ]) {
      const connectionStatus = connectionsManager.statusOf(connection.id);
      if (connectionStatus !== ConnectionStatus.Connected) {
        connections.push({
          name: getConnectionTitle(connection),
          connectionInfo: connection,
          connectionStatus,
        });
      } else {
        const connectionInstance = instances[connection.id];
        const connectionDatabases = databases[connection.id];

        const status = connectionInstance?.databasesStatus;
        const isReady =
          status !== undefined && !['initial', 'fetching'].includes(status);
        const isDataLake = connectionInstance?.dataLake?.isDataLake ?? false;
        const isWritable = connectionInstance?.isWritable ?? false;

        const isPerformanceTabSupportedOnConnection =
          !isDataLake && !!isPerformanceTabSupported[connection.id];

        connections.push({
          isReady,
          isDataLake,
          isWritable,
          isPerformanceTabSupported: isPerformanceTabSupportedOnConnection,
          name: getConnectionTitle(connection),
          connectionInfo: connection,
          databasesLength: connectionDatabases?.databases?.length ?? 0,
          databasesStatus:
            status as SidebarConnectedConnection['databasesStatus'],
          databases: connectionDatabases?.databases ?? [],
          connectionStatus: ConnectionStatus.Connected,
        });
      }
    }
    return connections;
  }, [
    connectionsManager,
    favoriteConnections,
    recentConnections,
    instances,
    databases,
    isPerformanceTabSupported,
  ]);

  const { filtered, expanded, onConnectionToggle, onDatabaseToggle } =
    useFilteredConnections(
      connections,
      filterRegex,
      fetchAllCollections,
      onDatabaseExpand
    );

  const onNotConnectedConnectionItemAction = useCallback(
    (item: SidebarNotConnectedConnectionTreeItem, action: Actions) => {
      switch (action) {
        case 'connection-connect':
          onConnect(item.connectionInfo);
          onConnectionToggle(item.connectionInfo.id, true);
          return;
        case 'edit-connection':
          onEditConnection(item.connectionInfo);
          return;
        case 'copy-connection-string':
          onCopyConnectionString(item.connectionInfo, false);
          return;
        case 'connection-toggle-favorite':
          onToggleFavoriteConnectionInfo(item.connectionInfo, false);
          return;
        case 'duplicate-connection':
          onDuplicateConnection(item.connectionInfo);
          return;
        case 'remove-connection':
          onRemoveConnection(item.connectionInfo);
          return;
      }
    },
    [
      onConnect,
      onConnectionToggle,
      onEditConnection,
      onCopyConnectionString,
      onToggleFavoriteConnectionInfo,
      onDuplicateConnection,
      onRemoveConnection,
    ]
  );

  const onConnectedConnectionItemAction = useCallback(
    (item: SidebarConnectedConnectionTreeItem, action: Actions) => {
      switch (action) {
        case 'select-connection':
          openDatabasesWorkspace(item.connectionInfo.id);
          return;
        case 'create-database':
          _onNamespaceAction(item.connectionInfo.id, '', action);
          return;
        case 'connection-performance-metrics':
          openPerformanceWorkspace(item.connectionInfo.id);
          return;
        case 'open-connection-info':
          onOpenConnectionInfo(item.connectionInfo.id);
          return;
        case 'copy-connection-string':
          onCopyConnectionString(item.connectionInfo, true);
          return;
        case 'connection-toggle-favorite':
          onToggleFavoriteConnectionInfo(item.connectionInfo, true);
          return;
        case 'connection-disconnect':
          onDisconnect(item.connectionInfo.id);
          return;
      }
    },
    [
      _onNamespaceAction,
      openDatabasesWorkspace,
      openPerformanceWorkspace,
      onOpenConnectionInfo,
      onCopyConnectionString,
      onToggleFavoriteConnectionInfo,
      onDisconnect,
    ]
  );

  const onNamespaceAction = useCallback(
    (connectionId: string, ns: string, action: Actions) => {
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
              (conn): conn is SidebarConnectedConnection =>
                conn.connectionStatus === ConnectionStatus.Connected &&
                conn.connectionInfo.id === connectionId
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
    },
    [
      connections,
      openCollectionsWorkspace,
      openCollectionWorkspace,
      openEditViewWorkspace,
      _onNamespaceAction,
    ]
  );

  const onItemAction = useCallback(
    (item: SidebarItem, action: Actions) => {
      if (
        item.type === 'connection' &&
        item.connectionStatus !== ConnectionStatus.Connected
      ) {
        onNotConnectedConnectionItemAction(item, action);
        return;
      } else if (
        item.type === 'connection' &&
        item.connectionStatus === ConnectionStatus.Connected
      ) {
        onConnectedConnectionItemAction(item, action);
      } else {
        const namespace =
          item.type === 'database' ? item.dbName : item.namespace;
        onNamespaceAction(item.connectionId, namespace, action);
      }
    },
    [
      onNotConnectedConnectionItemAction,
      onConnectedConnectionItemAction,
      onNamespaceAction,
    ]
  );

  const onItemExpand = useCallback(
    (item: SidebarItem, isExpanded: boolean) => {
      if (item.type === 'connection') {
        onConnectionToggle(item.connectionInfo.id, isExpanded);
      } else if (item.type === 'database') {
        onDatabaseToggle(item.connectionId, item.dbName, isExpanded);
      }
    },
    [onConnectionToggle, onDatabaseToggle]
  );

  // auto-expanding on a workspace change
  useEffect(() => {
    if (
      activeWorkspace &&
      (activeWorkspace.type === 'Databases' ||
        activeWorkspace.type === 'Collections' ||
        activeWorkspace.type === 'Collection')
    ) {
      const connectionId: string = activeWorkspace.connectionId;
      onConnectionToggle(connectionId, true);

      if (activeWorkspace.type !== 'Databases') {
        const namespace: string = activeWorkspace.namespace;
        onDatabaseToggle(connectionId, namespace, true);
      }
    }
  }, [activeWorkspace, onDatabaseToggle, onConnectionToggle]);

  // listening on connections change
  useEffect(() => {
    // todo
  }, [connectionsManager]);

  return (
    <div className={connectionsContainerStyles}>
      <Subtitle className={activeConnectionListHeaderTitleStyles}>
        Connections
        {connections.length !== 0 && (
          <span className={activeConnectionCountStyles}>
            ({connections.length})
          </span>
        )}
      </Subtitle>
      <NavigationItemsFilter
        placeholder="Search connections"
        onFilterChange={onFilterChange}
      />
      <ConnectionsNavigationTree
        connections={filtered || connections}
        activeWorkspace={activeWorkspace}
        onItemAction={onItemAction}
        onItemExpand={onItemExpand}
        expanded={expanded}
      />
    </div>
  );
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

const mapStateToProps: MapStateToProps<
  MapStateProps,
  UnifiedConnectionsNavigationComponentProps,
  RootState
> = (_rootState) => {
  return {
    instances: _rootState.instance,
    databases: _rootState.databases,
    isPerformanceTabSupported: _rootState.isPerformanceTabSupported,
  };
};

const mapDispatchToProps: MapDispatchToProps<
  MapDispatchProps,
  UnifiedConnectionsNavigationComponentProps
> = {
  onNamespaceAction,
  onDatabaseExpand,
  fetchAllCollections,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(UnifiedConnectionsNavigation);
