import React, { useCallback, useEffect, useRef } from 'react';
import {
  type MapDispatchToProps,
  type MapStateToProps,
  connect,
} from 'react-redux';
import {
  type Actions,
  type SidebarItem,
  type SidebarConnectedConnection,
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
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';
import { useFilteredConnections } from '../../use-filtered-connections';

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
  connections: SidebarConnectedConnection[];
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
    databaseId: string
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

  const {
    filtered,
    expanded,
    onConnectionToggle,
    onDatabaseToggle,
    onConnectionsChanged,
  } = useFilteredConnections(
    connections,
    filterRegex,
    _fetchAllCollections,
    _onDatabaseExpand
  );

  const onConnectionsChangedRef = useRef(onConnectionsChanged);
  onConnectionsChangedRef.current = onConnectionsChanged;
  useEffect(() => {
    onConnectionsChangedRef.current(activeConnections);
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
    (connectionInfo: ConnectionInfo, action: Actions) => {
      const connectionId = connectionInfo.id;
      switch (action) {
        case 'open-shell':
          openShellWorkspace(connectionId, { newTab: true });
          return;
        case 'select-connection':
          openDatabasesWorkspace(connectionId);
          return;
        case 'create-database':
          _onNamespaceAction(connectionId, '', action);
          return;
        case 'connection-performance-metrics':
          openPerformanceWorkspace(connectionId);
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
        case 'connection-disconnect':
          onDisconnect(connectionId);
          return;
      }
    },
    [
      openShellWorkspace,
      openDatabasesWorkspace,
      _onNamespaceAction,
      openPerformanceWorkspace,
      onOpenConnectionInfo,
      onCopyConnectionString,
      onToggleFavoriteConnection,
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
          const connection = connections.find(
            (conn): conn is SidebarConnectedConnection => {
              return (
                conn.connectionStatus === ConnectionStatus.Connected &&
                conn.connectionInfo.id === connectionId
              );
            }
          );
          const databases = connection?.databases ?? [];
          const coll = findCollection(ns, databases);

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
      if (item.type === 'connection') {
        onConnectionAction(item.connectionInfo, action);
      } else {
        const namespace =
          item.type === 'database' ? item.dbName : item.namespace;
        onNamespaceAction(item.connectionId, namespace, action);
      }
    },
    [onConnectionAction, onNamespaceAction]
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
        expanded={expanded}
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
> = (state: RootState, { activeConnections }) => {
  const connections: SidebarConnectedConnection[] = [];

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
      databasesStatus: status as SidebarConnectedConnection['databasesStatus'],
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
