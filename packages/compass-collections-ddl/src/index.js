import DdlPlugin from './plugin';
import DdlStore from 'stores';
import CreateCollectionStore from 'stores/create-collection';
import DropCollectionStore from 'stores/drop-collection';
import Collation from 'components/collation';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Collections',
  component: DdlPlugin,
  order: 1
};

/**
 * Activate all the components in the Ddl package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Database.Tab', ROLE);
  appRegistry.registerComponent('Collation.Select', Collation);
  appRegistry.registerStore('CollectionDDL.CollectionsStore', DdlStore);
  appRegistry.registerStore('CollectionDDL.CreateCollectionStore', CreateCollectionStore);
  appRegistry.registerStore('CollectionDDL.DropCollectionStore', DropCollectionStore);
}

/**
 * Deactivate all the components in the Ddl package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Database.Tab', ROLE);
  appRegistry.deregisterComponent('Collation.Select');
  appRegistry.deregisterStore('CollectionDDL.CollectionsStore');
  appRegistry.deregisterStore('CollectionDDL.CreateCollectionStore');
  appRegistry.deregisterStore('CollectionDDL.DropCollectionStore');
}

export default DdlPlugin;
export { activate, deactivate };
