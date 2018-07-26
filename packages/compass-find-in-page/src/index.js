import CompassFindInPagePlugin from './plugin';
import CompassFindInPageStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'FindInPage',
  component: CompassFindInPagePlugin
};

/**
 * Activate all the components in the Compass Find In Page package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the CompassFindInPagePlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Database.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Collection.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - CollectionHUD.Item: { name <String>, component: <React.Component> }
  //   - Header.Item: { name: <String>, component: <React.Component>, alignment: <String> }

  appRegistry.registerRole('Find', ROLE);
  appRegistry.registerStore('FindInPage.Store', CompassFindInPageStore);
}

/**
 * Deactivate all the components in the Compass Find In Page package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Find', ROLE);
  appRegistry.deregisterStore('FindInPage.Store');
}

export default CompassFindInPagePlugin;
export { activate, deactivate };
