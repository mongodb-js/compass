import React from 'react';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import DatabasesNavigationTree from '@mongodb-js/compass-databases-navigation';
import type { Actions } from '@mongodb-js/compass-databases-navigation';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import toNS from 'mongodb-ns';
import { toggleDatabaseExpanded } from '../modules/databases';
import { withPreferences } from 'compass-preferences-model';

function mapStateToProps(state: any) {
  // TODO: type state
  const {
    databases: {
      filterRegex,
      filteredDatabases,
      expandedDbList,
      activeNamespace,
    },
    instance,
  } = state;
  const status = instance?.databasesStatus;
  const isReady =
    status !== undefined && !['initial', 'fetching'].includes(status as string);
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
    activeNamespace,
    databases: filteredDatabases,
    expanded,
  };
}

const onNamespaceAction = (namespace: string, action: Actions) => {
  return (dispatch: Dispatch) => {
    const emit = (...args: any[]) => dispatch(globalAppRegistryEmit(...args));
    const ns = toNS(namespace);
    switch (action) {
      case 'select-database':
        emit('select-database', ns.database);
        return;
      case 'select-collection':
        emit('sidebar-select-collection', ns);
        return;
      case 'drop-database':
        emit('open-drop-database', ns.database);
        return;
      case 'drop-collection':
        emit('open-drop-collection', ns);
        return;
      case 'create-collection':
        emit('open-create-collection', ns);
        return;
      case 'open-in-new-tab':
        emit('sidebar-open-collection-in-new-tab', ns);
        return;
      case 'modify-view':
        emit('sidebar-modify-view', ns);
        return;
      case 'duplicate-view':
        emit('sidebar-duplicate-view', ns);
        break;
      default:
      // no-op
    }
  };
};

export default connect(mapStateToProps, {
  onDatabaseExpand: toggleDatabaseExpanded,
  onNamespaceAction,
})(withPreferences(DatabasesNavigationTree, ['readOnly'], React));
