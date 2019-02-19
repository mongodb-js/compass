import IndexesPlugin from './plugin';
import IndexesStore from 'stores';
import CreateIndexStore from 'stores/create-index';
import DropIndexStore from 'stores/drop-index';
import IndexDefintionType from 'components/index-defintion-type';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Indexes',
  component: IndexesPlugin,
  order: 6
};

/**
 * Activate all the components in the Indexes package.
 * @param {Object} appRegistry - The Hadron appRegistry to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Tab', ROLE);
  appRegistry.registerStore('Indexes.Store', IndexesStore);
  appRegistry.registerStore('Indexes.CreateIndexStore', CreateIndexStore);
  appRegistry.registerStore('Indexes.DropIndexStore', DropIndexStore);
  appRegistry.registerComponent('Indexes.IndexDefinitionType', IndexDefintionType);
}

/**
 * Deactivate all the components in the Indexes package.
 * @param {Object} appRegistry - The Hadron appRegistry to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
  appRegistry.deregisterStore('Indexes.Store');
  appRegistry.deregisterStore('Indexes.CreateIndexStore');
  appRegistry.deregisterStore('Indexes.DropIndexStore');
  appRegistry.deregisterComponent('Indexes.IndexDefinitionType');
}

export default IndexesPlugin;
export { activate, deactivate };
