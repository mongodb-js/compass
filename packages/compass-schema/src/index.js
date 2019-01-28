import CompassSchemaPlugin from './plugin';
import CompassSchemaStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'CompassSchema',
  component: CompassSchemaPlugin
};

/**
 * Activate all the components in the Compass Schema package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the CompassSchemaPlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Database.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Collection.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - CollectionHUD.Item: { name <String>, component: <React.Component> }
  //   - Header.Item: { name: <String>, component: <React.Component>, alignment: <String> }

  appRegistry.registerRole('Collection.Tab', ROLE);
  appRegistry.registerStore('CompassSchema.Store', CompassSchemaStore);
}

/**
 * Deactivate all the components in the Compass Schema package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
  appRegistry.deregisterStore('CompassSchema.Store');
}

export default CompassSchemaPlugin;
export { activate, deactivate };
