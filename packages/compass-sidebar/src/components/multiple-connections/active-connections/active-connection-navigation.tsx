import React, { useCallback, useEffect, useState } from 'react';
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
} from '../../../modules/databases';
import type { RootState, SidebarThunkAction } from '../../../modules';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import {
  Subtitle,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';

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
});

const activeConnectionListHeaderTitleStyles = css({
  marginTop: 0,
  marginBottom: 0,
  textTransform: 'uppercase',
  fontSize: '12px',
});

const activeConnectionCountStyles = css({
  fontWeight: 'normal',
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
  activeWorkspace: { type: string; namespace?: string } | null;
  onOpenConnectionInfo: (connectionId: string) => void;
  onCopyConnectionString: (connectionId: string) => void;
  onToggleFavoriteConnection: (connectionId: string) => void;
}): React.ReactElement {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [namedConnections, setNamedConnections] = useState<
    { connectionInfo: ConnectionInfo; name: string }[]
  >([]);

  const {
    // TODO: add connection id as the first parameter
    openDatabasesWorkspace,
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
  } = useOpenWorkspace();

  const onConnectionToggle = (connectionId: string, forceExpand: boolean) => {
    if (!forceExpand && !collapsed.includes(connectionId))
      setCollapsed([...collapsed, connectionId]);
    else if (forceExpand && collapsed.includes(connectionId)) {
      const index = collapsed.indexOf(connectionId);
      setCollapsed([
        ...collapsed.slice(0, index),
        ...collapsed.slice(index + 1),
      ]);
    }
  };

  useEffect(() => {
    // cleanup connections that are no longer active
    // if the user connects again, the new connection should be expanded again
    const newCollapsed = activeConnections
      .filter(({ id }: ConnectionInfo) => collapsed.includes(id))
      .map(({ id }: ConnectionInfo) => id);
    setCollapsed(newCollapsed);

    const newConnectionList = activeConnections
      .map((connectionInfo) => ({
        connectionInfo,
        name: getConnectionTitle(connectionInfo),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    setNamedConnections(newConnectionList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnections]);

  const onNamespaceAction = useCallback(
    (connectionId: string, ns: string, action: Actions) => {
      switch (action) {
        case 'open-connection-info':
          onOpenConnectionInfo(connectionId);
          return;
        case 'copy-connection-string':
          onCopyConnectionString(connectionId);
          return;
        case 'connection-toggle-favorite':
          onToggleFavoriteConnection(connectionId);
          return;
        case 'select-database':
          openCollectionsWorkspace(ns);
          return;
        case 'select-collection':
          openCollectionWorkspace(ns);
          return;
        case 'open-in-new-tab':
          openCollectionWorkspace(ns, { newTab: true });
          return;
        case 'modify-view': {
          const coll = findCollection(
            ns,
            (connections.find((conn) => conn.connectionInfo.id === connectionId)
              ?.databases as Database[]) ?? []
          );
          if (coll && coll.sourceName && coll.pipeline) {
            openEditViewWorkspace(coll._id, {
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
      onCopyConnectionString,
      onOpenConnectionInfo,
      onToggleFavoriteConnection,
      _onNamespaceAction,
    ]
  );

  return (
    <div className={activeConnectionsContainerStyles}>
      <header className={activeConnectionListHeaderStyles}>
        <Subtitle className={activeConnectionListHeaderTitleStyles}>
          Active connections{' '}
          <span className={activeConnectionCountStyles}>
            ({activeConnections.length})
          </span>
        </Subtitle>
      </header>
      <ConnectionsNavigationTree
        isReady={true}
        connections={connections}
        activeNamespace={activeWorkspace?.namespace}
        onNamespaceAction={onNamespaceAction}
        onConnectionSelect={() => openDatabasesWorkspace()}
        onConnectionExpand={onConnectionToggle}
        expanded={namedConnections.reduce(
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

    connections.push({
      isReady,
      isDataLake,
      isWritable,
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
      case 'drop-database':
        emit('open-drop-database', ns.database);
        return;
      case 'rename-collection':
        emit('open-rename-collection', connectionId, ns);
        return;
      case 'drop-collection':
        emit('open-drop-collection', ns);
        return;
      case 'create-collection':
        emit('open-create-collection', ns);
        return;
      case 'duplicate-view': {
        const coll = findCollection(
          namespace,
          getState().databases[connectionId].databases
        );
        if (coll && coll.sourceName) {
          emit('open-create-view', {
            source: coll.sourceName,
            pipeline: coll.pipeline,
            duplicate: true,
          });
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
  onNamespaceAction,
})(ActiveConnectionNavigation);
