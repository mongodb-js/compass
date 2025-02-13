import toNS from 'mongodb-ns';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { connect } from 'react-redux';
import {
  ChevronCollapse,
  type ItemAction,
  ItemActionControls,
  Subtitle,
  css,
  spacing,
  Body,
  Button,
  Icon,
  ButtonVariant,
  cx,
  Placeholder,
} from '@mongodb-js/compass-components';
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
  type useConnectionsWithStatus,
  ConnectionStatus,
  useConnectionsListLoadingStatus,
} from '@mongodb-js/compass-connections/provider';
import {
  useOpenWorkspace,
  useWorkspacePlugins,
} from '@mongodb-js/compass-workspaces/provider';
import {
  onDatabaseExpand,
  fetchAllCollections,
  type Database,
} from '../../modules/databases';
import {
  type ConnectionsFilter,
  useFilteredConnections,
} from '../use-filtered-connections';
import NavigationItemsFilter from '../navigation-items-filter';
import {
  type ConnectionImportExportAction,
  useOpenConnectionImportExportModal,
} from '@mongodb-js/compass-connection-import-export';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { usePreference } from 'compass-preferences-model/provider';

const connectionsContainerStyles = css({
  height: '100%',
  paddingBottom: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const connectionListHeaderStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});

const connectionListHeaderTitleStyles = css({
  marginTop: 0,
  marginBottom: 0,
  textTransform: 'uppercase',
  fontSize: '12px',
  lineHeight: `${spacing[800]}px`,
});

const connectionCountStyles = css({
  fontWeight: 'normal',
  marginLeft: spacing[100],
});

const connectionCountDisabledStyles = css({
  opacity: 0.6,
});

const noDeploymentStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

/**
 * Indicates only Atlas cluster connections are supported, and the user cannot navigate
 * to other types of connections from this UI.
 */
export const AtlasClusterConnectionsOnly = createContext<boolean>(false);

function findCollection(ns: string, databases: Database[]) {
  const { database, collection } = toNS(ns);

  return (
    databases
      .find((db) => db._id === database)
      ?.collections.find((coll) => coll.name === collection) ?? null
  );
}

type ConnectionListTitleActions =
  | 'collapse-all-connections'
  | 'add-new-connection'
  | ConnectionImportExportAction;

type ConnectionsNavigationComponentProps = {
  connectionsWithStatus: ReturnType<typeof useConnectionsWithStatus>;
  activeWorkspace: WorkspaceTab | null;
  filter: ConnectionsFilter;
  onFilterChange(
    updater: (filter: ConnectionsFilter) => ConnectionsFilter
  ): void;
  onConnect(info: ConnectionInfo): void;
  onConnectInNewWindow(info: ConnectionInfo): void;
  onNewConnection(): void;
  onEditConnection(info: ConnectionInfo): void;
  onRemoveConnection(info: ConnectionInfo): void;
  onDuplicateConnection(info: ConnectionInfo): void;
  onCopyConnectionString(info: ConnectionInfo): void;
  onToggleFavoriteConnectionInfo(info: ConnectionInfo): void;
  onOpenCsfleModal(connectionId: string): void;
  onOpenNonGenuineMongoDBModal(connectionId: string): void;
  onOpenConnectionInfo(id: string): void;
  onDisconnect(id: string): void;
  onOpenConnectViaModal?: (
    atlasMetadata: ConnectionInfo['atlasMetadata']
  ) => void;
};

type MapStateProps = {
  instances: RootState['instance'];
  databases: RootState['databases'];
  isPerformanceTabSupported: RootState['isPerformanceTabSupported'];
};

type MapDispatchProps = {
  fetchAllCollections(): void;
  onDatabaseExpand(connectionId: string, dbId: string): void;
  onRefreshDatabases(connectionId: string): void;
  onNamespaceAction(
    connectionId: string,
    namespace: string,
    action: Actions
  ): void;
};

type ConnectionsNavigationProps = ConnectionsNavigationComponentProps &
  MapStateProps &
  MapDispatchProps;

const ConnectionsNavigation: React.FC<ConnectionsNavigationProps> = ({
  connectionsWithStatus,
  activeWorkspace,
  filter,
  instances,
  databases,
  isPerformanceTabSupported,
  onFilterChange,
  onConnect,
  onConnectInNewWindow,
  onNewConnection,
  onEditConnection,
  onRemoveConnection,
  onDuplicateConnection,
  onCopyConnectionString,
  onToggleFavoriteConnectionInfo,
  onOpenCsfleModal,
  onOpenNonGenuineMongoDBModal,
  onOpenConnectionInfo,
  onDisconnect,
  onDatabaseExpand,
  fetchAllCollections,
  onRefreshDatabases: _onRefreshDatabases,
  onNamespaceAction: _onNamespaceAction,
  onOpenConnectViaModal,
}) => {
  const {
    openShellWorkspace,
    openPerformanceWorkspace,
    openDatabasesWorkspace,
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
  } = useOpenWorkspace();
  const { hasWorkspacePlugin } = useWorkspacePlugins();
  const track = useTelemetry();
  const connections = useMemo(() => {
    const connections: SidebarConnection[] = [];

    for (const {
      connectionInfo: connection,
      connectionStatus,
    } of connectionsWithStatus) {
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
          isPerformanceTabAvailable: hasWorkspacePlugin('Performance'),
          isPerformanceTabSupported: isPerformanceTabSupportedOnConnection,
          name: getConnectionTitle(connection),
          connectionInfo: connection,
          databasesLength: connectionDatabases?.databases?.length ?? 0,
          databasesStatus:
            status as SidebarConnectedConnection['databasesStatus'],
          databases: connectionDatabases?.databases ?? [],
          connectionStatus: ConnectionStatus.Connected,
          isGenuineMongoDB:
            connectionInstance?.genuineMongoDB.isGenuine !== false,
          csfleMode: connectionInstance?.csfleMode,
        });
      }
    }
    return connections;
  }, [
    connectionsWithStatus,
    instances,
    databases,
    isPerformanceTabSupported,
    hasWorkspacePlugin,
  ]);

  const { supportsConnectionImportExport, openConnectionImportExportModal } =
    useOpenConnectionImportExportModal({ context: 'connectionsList' });

  const enableCreatingNewConnections = usePreference(
    'enableCreatingNewConnections'
  );

  const {
    filtered,
    expanded,
    onCollapseAll,
    onConnectionToggle,
    onDatabaseToggle,
  } = useFilteredConnections({
    connections,
    filter,
    fetchAllCollections,
    onDatabaseExpand,
  });

  const connectionListTitleActions =
    useMemo((): ItemAction<ConnectionListTitleActions>[] => {
      const actions: ItemAction<ConnectionListTitleActions>[] = [
        {
          action: 'collapse-all-connections',
          label: 'Collapse all connections',
          icon: <ChevronCollapse width={14} height={14} />,
        },
      ];

      if (enableCreatingNewConnections) {
        actions.push({
          action: 'add-new-connection',
          label: 'Add new connection',
          icon: 'Plus',
        });
      }

      if (supportsConnectionImportExport) {
        actions.push(
          {
            action: 'import-saved-connections',
            label: 'Import connections',
            icon: 'Download',
          },
          {
            action: 'export-saved-connections',
            label: 'Export connections',
            icon: 'Export',
          }
        );
      }

      return actions;
    }, [supportsConnectionImportExport, enableCreatingNewConnections]);

  const onConnectionItemAction = useCallback(
    (
      item:
        | SidebarConnectedConnectionTreeItem
        | SidebarNotConnectedConnectionTreeItem,
      action: Actions
    ) => {
      switch (action) {
        case 'select-connection':
          openDatabasesWorkspace(item.connectionInfo.id);
          return;
        case 'refresh-databases':
          _onRefreshDatabases(item.connectionInfo.id);
          return;
        case 'create-database':
          _onNamespaceAction(item.connectionInfo.id, '', action);
          return;
        case 'open-shell':
          openShellWorkspace(item.connectionInfo.id, { newTab: true });
          track('Open Shell', { entrypoint: 'sidebar' }, item.connectionInfo);
          return;
        case 'connection-performance-metrics':
          openPerformanceWorkspace(item.connectionInfo.id);
          return;
        case 'open-connection-info':
          onOpenConnectionInfo(item.connectionInfo.id);
          return;
        case 'connection-disconnect':
          onDisconnect(item.connectionInfo.id);
          return;
        case 'connection-connect':
          onConnect(item.connectionInfo);
          return;
        case 'connection-connect-in-new-window':
          onConnectInNewWindow(item.connectionInfo);
          return;
        case 'edit-connection':
          onEditConnection(item.connectionInfo);
          return;
        case 'copy-connection-string':
          onCopyConnectionString(item.connectionInfo);
          return;
        case 'connection-toggle-favorite':
          onToggleFavoriteConnectionInfo(item.connectionInfo);
          return;
        case 'duplicate-connection':
          onDuplicateConnection(item.connectionInfo);
          return;
        case 'remove-connection':
          onRemoveConnection(item.connectionInfo);
          return;
        case 'open-csfle-modal':
          onOpenCsfleModal(item.connectionInfo.id);
          return;
        case 'open-non-genuine-mongodb-modal':
          onOpenNonGenuineMongoDBModal(item.connectionInfo.id);
          return;
        case 'show-connect-via-modal':
          onOpenConnectViaModal?.(item.connectionInfo.atlasMetadata);
          return;
      }
    },
    [
      openDatabasesWorkspace,
      _onRefreshDatabases,
      _onNamespaceAction,
      openShellWorkspace,
      track,
      openPerformanceWorkspace,
      onOpenConnectionInfo,
      onDisconnect,
      onConnect,
      onConnectInNewWindow,
      onEditConnection,
      onCopyConnectionString,
      onToggleFavoriteConnectionInfo,
      onDuplicateConnection,
      onRemoveConnection,
      onOpenCsfleModal,
      onOpenNonGenuineMongoDBModal,
      onOpenConnectViaModal,
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
      if (item.type === 'connection') {
        onConnectionItemAction(item, action);
      } else {
        const namespace =
          item.type === 'database' ? item.dbName : item.namespace;
        onNamespaceAction(item.connectionId, namespace, action);
      }
    },
    [onConnectionItemAction, onNamespaceAction]
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

  const onConnectionListTitleAction = useCallback(
    (action: ConnectionListTitleActions) => {
      if (action === 'collapse-all-connections') {
        onCollapseAll();
      } else if (action === 'add-new-connection') {
        onNewConnection();
      } else if (
        action === 'import-saved-connections' ||
        action === 'export-saved-connections'
      ) {
        openConnectionImportExportModal(action);
      }
    },
    [onCollapseAll, onNewConnection, openConnectionImportExportModal]
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

  const isAtlasConnectionStorage = useContext(AtlasClusterConnectionsOnly);

  const { isInitialLoad: isInitialConnectionsLoad } =
    useConnectionsListLoadingStatus();

  const connectionsCount = isInitialConnectionsLoad ? (
    <span className={cx(connectionCountStyles, connectionCountDisabledStyles)}>
      (…)
    </span>
  ) : connections.length !== 0 ? (
    <span className={connectionCountStyles}>({connections.length})</span>
  ) : undefined;

  return (
    <div className={connectionsContainerStyles}>
      <div
        className={connectionListHeaderStyles}
        data-testid="connections-header"
      >
        <Subtitle className={connectionListHeaderTitleStyles}>
          {isAtlasConnectionStorage ? 'Clusters' : 'Connections'}
          {connectionsCount}
        </Subtitle>
        <ItemActionControls<ConnectionListTitleActions>
          iconSize="xsmall"
          actions={connectionListTitleActions}
          onAction={onConnectionListTitleAction}
          data-testid="connections-list-title-actions"
          collapseToMenuThreshold={3}
          collapseAfter={2}
        ></ItemActionControls>
      </div>
      <NavigationItemsFilter
        placeholder={
          isAtlasConnectionStorage ? 'Search clusters' : 'Search connections'
        }
        filter={filter}
        onFilterChange={onFilterChange}
        disabled={isInitialConnectionsLoad || connections.length === 0}
      />
      {isInitialConnectionsLoad ? (
        <ConnectionsPlaceholder></ConnectionsPlaceholder>
      ) : connections.length > 0 ? (
        <ConnectionsNavigationTree
          connections={filtered || connections}
          activeWorkspace={activeWorkspace}
          onItemAction={onItemAction}
          onItemExpand={onItemExpand}
          expanded={expanded}
        />
      ) : connections.length === 0 ? (
        <div className={noDeploymentStyles}>
          <Body data-testid="no-deployments-text">
            You have not connected to any deployments.
          </Body>
          {enableCreatingNewConnections && (
            <Button
              data-testid="add-new-connection-button"
              variant={ButtonVariant.Primary}
              leftGlyph={<Icon glyph="Plus" />}
              onClick={onNewConnection}
            >
              Add new connection
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
};

const placeholderListStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  // placeholder height that visually matches font size (16px) + vertical
  // spacing (12px) to align it visually with real items
  gridAutoRows: spacing[400] + spacing[300],
  alignItems: 'center',
  // navigation list padding + "empty" caret icon space (4px) to align it
  // visually with real items
  paddingLeft: spacing[400] + spacing[100],
  paddingRight: spacing[400],
});

function ConnectionsPlaceholder() {
  return (
    <div
      data-testid="connections-placeholder"
      className={placeholderListStyles}
    >
      {Array.from({ length: 3 }, (_, index) => (
        <Placeholder key={index} height={spacing[400]}></Placeholder>
      ))}
    </div>
  );
}

const onRefreshDatabases = (connectionId: string): SidebarThunkAction<void> => {
  return (_dispatch, getState, { globalAppRegistry }) => {
    globalAppRegistry.emit('refresh-databases', { connectionId });
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

const mapStateToProps: MapStateToProps<
  MapStateProps,
  ConnectionsNavigationComponentProps,
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
  ConnectionsNavigationComponentProps
> = {
  onRefreshDatabases,
  onNamespaceAction,
  onDatabaseExpand,
  fetchAllCollections,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectionsNavigation);
