import LoadingPlugin from './plugin';
import LoadingStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Loading',
  component: LoadingPlugin
};

/**
 * Activate all the components in the Loading package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the LoadingPlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Database.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Collection.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - CollectionHUD.Item: { name <String>, component: <React.Component> }
  //   - Header.Item: { name: <String>, component: <React.Component>, alignment: <String> }

  appRegistry.registerRole('Loading.Screen', ROLE);
  appRegistry.registerStore('Loading.Store', LoadingStore);
}

/**
 * Deactivate all the components in the Loading package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Loading.Screen', ROLE);
  appRegistry.deregisterStore('Loading.Store');
}

export default LoadingPlugin;
export { activate, deactivate };
