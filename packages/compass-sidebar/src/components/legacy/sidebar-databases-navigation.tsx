import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { ConnectionsNavigationTree } from '@mongodb-js/compass-connections-navigation';
import type { Actions } from '@mongodb-js/compass-connections-navigation';
import toNS from 'mongodb-ns';
import type { Database } from '../../modules/databases';
import { toggleDatabaseExpanded } from '../../modules/databases';
import { usePreference } from 'compass-preferences-model/provider';
import type { RootState, SidebarThunkAction } from '../../modules';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';

function findCollection(ns: string, databases: Database[]) {
  const { database, collection } = toNS(ns);

  return (
    databases
      .find((db) => db._id === database)
      ?.collections.find((coll) => coll.name === collection) ?? null
  );
}

function SidebarDatabasesNavigation({
  isDataLake,
  isWritable,
  onNamespaceAction: _onNamespaceAction,
  databases,
  ...dbNavigationProps
}: Omit<
  React.ComponentProps<typeof ConnectionsNavigationTree>,
  'isReadOnly' | 'databases'
> & {
  databases: Database[];
  isDataLake?: boolean;
  isWritable?: boolean;
  expanded?: Record<string, boolean>;
}) {
  const {
    openCollectionsWorkspace,
    openCollectionWorkspace,
    openEditViewWorkspace,
  } = useOpenWorkspace();
  const preferencesReadOnly = usePreference('readOnly');
  const isReadOnly = preferencesReadOnly || isDataLake || !isWritable;
  const onNamespaceAction = useCallback(
    (ns: string, action: Actions) => {
      switch (action) {
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
          const coll = findCollection(ns, databases);
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
          _onNamespaceAction(ns, action);
          return;
      }
    },
    [
      databases,
      openCollectionsWorkspace,
      openCollectionWorkspace,
      openEditViewWorkspace,
      _onNamespaceAction,
    ]
  );

  return (
    <ConnectionsNavigationTree
      {...dbNavigationProps}
      databases={databases}
      onNamespaceAction={onNamespaceAction}
      isReadOnly={isReadOnly}
    />
  );
}

function mapStateToProps(state: RootState) {
  const {
    databases: { filterRegex, filteredDatabases, expandedDbList },
    instance,
  } = state;
  const status = instance?.databasesStatus;
  const isReady =
    status !== undefined && !['initial', 'fetching'].includes(status);
  const defaultExpanded = Boolean(filterRegex);
  const expanded = Object.fromEntries(
    (filteredDatabases as any[]).map(({ name }) => [
      name,
      expandedDbList[name] ?? defaultExpanded,
    ])
  );
  const isDataLake = instance?.dataLake.isDataLake;
  const isWritable = instance?.isWritable;

  return {
    isReady,
    isDataLake,
    isWritable,
    databases: filteredDatabases,
    expanded,
  };
}

const onNamespaceAction = (
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
        emit('open-rename-collection', ns);
        return;
      case 'drop-collection':
        emit('open-drop-collection', ns);
        return;
      case 'create-collection':
        emit('open-create-collection', ns);
        return;
      case 'duplicate-view': {
        const coll = findCollection(namespace, getState().databases.databases);
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
