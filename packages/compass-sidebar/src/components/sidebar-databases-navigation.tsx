import React from 'react';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import DatabasesNavigationTree from '@mongodb-js/compass-databases-navigation';
import type { Actions } from '@mongodb-js/compass-databases-navigation';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import toNS from 'mongodb-ns';
import { toggleDatabaseExpanded } from '../modules/databases';
import { withPreferences } from 'compass-preferences-model';
import type { RootState } from '../modules';

function SidebarDatabasesNavigation({
  readOnly,
  isDataLake,
  isWritable,
  ...dbNavigationProps
}: Omit<React.ComponentProps<typeof DatabasesNavigationTree>, 'isReadOnly'> & {
  readOnly?: boolean;
  isDataLake?: boolean;
  isWritable?: boolean;
}) {
  const isReadOnly = readOnly || isDataLake || !isWritable;
  return (
    <DatabasesNavigationTree {...dbNavigationProps} isReadOnly={isReadOnly} />
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
      case 'rename-collection':
        emit('open-rename-collection', ns);
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
})(withPreferences(SidebarDatabasesNavigation, ['readOnly'], React));
