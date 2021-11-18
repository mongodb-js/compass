import { connect } from 'react-redux';
import { DatabasesNavigationTree } from '@mongodb-js/compass-components';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import toNS from 'mongodb-ns';
import { toggleDatabaseExpanded } from '../../modules/databases';

function mapStateToProps(state) {
  const {
    databases: { filterRegex, databases, expandedDbList, activeNamespace },
  } = state;
  const defaultExpanded = Boolean(filterRegex);
  const expanded = Object.fromEntries(
    databases.map(({ name }) => [name, expandedDbList[name] ?? defaultExpanded])
  );
  const isReadOnly =
    process.env.HADRON_READONLY === 'true' ||
    state.isDataLake ||
    !state.isWritable;

  return {
    isReadOnly,
    activeNamespace,
    databases,
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
        emit('select-namespace', {
          // TODO: Currently a lot of things rely on this event providing
          // collection info and not only the namespace, maybe we can avoid that
          namespace: ns.ns,
        });
        return;
      case 'drop-database':
        emit('open-drop-database', ns.database);
        return;
      case 'drop-collection':
        emit('open-drop-collection', ns.database, ns.collection);
        return;
      case 'create-collection':
        emit('open-create-collection', ns.database);
        return;
      case 'open-in-new-tab':
      case 'modify-view':
        emit('open-namespace-in-new-tab', {
          // TODO: These two need some digging to figure out what exactly is
          // getting passed around in the event
        });
        return;
      case 'duplicate-view':
        emit('open-create-view', {
          // TODO: we might not have this data yet, where to handle this?
          // source: `${coll.database}.${coll.view_on}`,
          // pipeline: coll.pipeline,
          // duplicate: true,
        });
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
