import AutoUpdatesPlugin from './plugin';
import AutoUpdatesStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  component: AutoUpdatesPlugin
};

/**
 * Activate all the components in the Compass Auto Updates package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the CompassAutoUpdatesPlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Database.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Collection.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - CollectionHUD.Item: { name <String>, component: <React.Component> }
  //   - Header.Item: { name: <String>, component: <React.Component>, alignment: <String> }

  appRegistry.registerRole('App.AutoUpdate', ROLE);
  appRegistry.registerStore('AutoUpdates.Store', AutoUpdatesStore);
}

/**
 * Deactivate all the components in the Compass Auto Updates package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('App.AutoUpdate', ROLE);
  appRegistry.deregisterStore('AutoUpdates.Store');
}

export default AutoUpdatesPlugin;
export { activate, deactivate };
