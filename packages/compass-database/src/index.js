import DatabasePlugin from './plugin';
import DatabaseStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Database',
  component: DatabasePlugin
};

/**
 * Activate all the components in the Database package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the DatabasePlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Database.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Collection.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - CollectionHUD.Item: { name <String>, component: <React.Component> }
  //   - Header.Item: { name: <String>, component: <React.Component>, alignment: <String> }

  appRegistry.registerRole('Database.Workspace', ROLE);
  appRegistry.registerStore('Database.Store', DatabaseStore);
}

/**
 * Deactivate all the components in the Database package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Database.Workspace', ROLE);
  appRegistry.deregisterStore('Database.Store');
}

export default DatabasePlugin;
export { activate, deactivate };
