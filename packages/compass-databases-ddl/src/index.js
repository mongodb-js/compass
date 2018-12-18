import DdlPlugin from './plugin';
import DdlStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Ddl',
  component: DdlPlugin
};

/**
 * Activate all the components in the Ddl package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the DdlPlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Database.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Collection.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - CollectionHUD.Item: { name <String>, component: <React.Component> }
  //   - Header.Item: { name: <String>, component: <React.Component>, alignment: <String> }

  appRegistry.registerRole('Instance.Tab', ROLE);
  appRegistry.registerStore('Ddl.Store', DdlStore);
}

/**
 * Deactivate all the components in the Ddl package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Instance.Tab', ROLE);
  appRegistry.deregisterStore('Ddl.Store');
}

export default DdlPlugin;
export { activate, deactivate };
