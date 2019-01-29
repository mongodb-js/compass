import CollectionPlugin from './plugin';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Collection',
  component: CollectionPlugin
};

/**
 * Activate all the components in the Collection package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Workspace', ROLE);
}

/**
 * Deactivate all the components in the Collection package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Workspace', ROLE);
}

export default CollectionPlugin;
export { activate, deactivate };
