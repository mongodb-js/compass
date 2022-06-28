import { connect } from 'react-redux';
import DatabasesNavigationTree from '@mongodb-js/compass-databases-navigation';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import toNS from 'mongodb-ns';
import { toggleDatabaseExpanded } from '../../modules/databases';

function mapStateToProps(state) {
  const {
    databases: {
      filterRegex,
      filteredDatabases,
      expandedDbList,
      activeNamespace,
    },
    instance,
  } = state;
  const isReady = !['initial', 'fetching'].includes(instance?.databasesStatus);
  const defaultExpanded = Boolean(filterRegex);
  const expanded = Object.fromEntries(
    filteredDatabases.map(({ name }) => [
      name,
      expandedDbList[name] ?? defaultExpanded,
    ])
  );
  const isReadOnly =
    process.env.HADRON_READONLY === 'true' ||
    state.isDataLake ||
    !state.isWritable;
  return {
    isReady,
    isReadOnly,
    activeNamespace,
    databases: filteredDatabases,
    expanded,
  };
}

const onNamespaceAction = (namespace, action) => {
  return (dispatch) => {
    const emit = (...args) => dispatch(globalAppRegistryEmit(...args));
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
})(DatabasesNavigationTree);
