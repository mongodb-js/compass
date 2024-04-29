import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { ConnectionsNavigationTree } from '@mongodb-js/compass-connections-navigation';
import type {
  Actions,
  Connection,
} from '@mongodb-js/compass-connections-navigation';
import toNS from 'mongodb-ns';
import { type Database, toggleDatabaseExpanded } from '../../modules/databases';
import { usePreference } from 'compass-preferences-model/provider';
import type { RootState, SidebarThunkAction } from '../../modules';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

function findCollection(ns: string, databases: Database[]) {
  const { database, collection } = toNS(ns);

  return (
    databases
      .find((db) => db._id === database)
      ?.collections.find((coll) => coll.name === collection) ?? null
  );
}

function SidebarDatabasesNavigation({
  connections,
  onNamespaceAction: _onNamespaceAction,
  onDatabaseExpand,
  activeWorkspace,
  ...dbNavigationProps
}: Omit<
  React.ComponentProps<typeof ConnectionsNavigationTree>,
  'isReadOnly' | 'databases'
> & {
  connections: Connection[];
  expanded?: Record<string, Record<string, boolean> | false>;
}) {
  const {
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
  } = useOpenWorkspace();
  const preferencesReadOnly = usePreference('readOnly');
  const connection = connections[0];
  const isReadOnly =
    preferencesReadOnly || connection.isDataLake || !connection.isWritable;
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
            (connection.databases as Database[]) || []
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
      connection,
      openCollectionsWorkspace,
      openCollectionWorkspace,
      openEditViewWorkspace,
      _onNamespaceAction,
    ]
  );

  // auto-expanding on a workspace change
  useEffect(() => {
    if (
      activeWorkspace &&
      (activeWorkspace.type === 'Collections' ||
        activeWorkspace.type === 'Collection')
    ) {
      const namespace: string = activeWorkspace.namespace;
      onDatabaseExpand(connection.connectionInfo.id, namespace, true);
    }
  }, [activeWorkspace, onDatabaseExpand, connection.connectionInfo.id]);

  return (
    <ConnectionsNavigationTree
      connections={connections}
      {...dbNavigationProps}
      onNamespaceAction={onNamespaceAction}
      onDatabaseExpand={onDatabaseExpand}
      activeWorkspace={activeWorkspace}
      isReadOnly={isReadOnly}
    />
  );
}

function mapStateToProps(
  state: RootState,
  { connectionInfo }: { connectionInfo: ConnectionInfo }
): {
  isReady: boolean;
  connections: Connection[];
  expanded: Record<string, Record<string, boolean> | false>;
} {
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

  return {
    isReady: true,
    connections: [
      {
        isReady,
        isDataLake,
        isWritable,
        name: '',
        connectionInfo,
        databasesLength: filteredDatabases?.length || 0,
        databasesStatus: (status ??
          'fetching') as Connection['databasesStatus'],
        databases: filteredDatabases ?? [],
      },
    ],
    expanded: {
      [connectionId]: expanded,
    },
  };
}

const onNamespaceAction = (
  connectionId: string,
  namespace: string,
  action: Actions
): SidebarThunkAction<void> => {
  return (_dispatch, getState, { globalAppRegistry }) => {
    // TODO: COMPASS-7719 to adapt modals to be multiple connection aware
    const emit = (action: string, ...rest: any[]) => {
      globalAppRegistry.emit(action, ...rest);
    };
    const ns = toNS(namespace);
    switch (action) {
      case 'drop-database':
        emit('open-drop-database', connectionId, ns.database);
        return;
      case 'rename-collection':
        emit('open-rename-collection', connectionId, ns);
        return;
      case 'drop-collection':
        emit('open-drop-collection', connectionId, ns);
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
})(SidebarDatabasesNavigation);
