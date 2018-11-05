import CompassJsonSchemaValidationPlugin from './plugin';
import CompassJsonSchemaValidationStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Validation',
  component: CompassJsonSchemaValidationPlugin
};

/**
 * Activate all the components in the Compass Json Schema Validation package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the CompassJsonSchemaValidationPlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Database.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Collection.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - CollectionHUD.Item: { name <String>, component: <React.Component> }
  //   - Header.Item: { name: <String>, component: <React.Component>, alignment: <String> }

  appRegistry.registerRole('Collection.Tab', ROLE);
  appRegistry.registerStore('CompassJsonSchemaValidation.Store', CompassJsonSchemaValidationStore);
}

/**
 * Deactivate all the components in the Compass Json Schema Validation package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
  appRegistry.deregisterStore('CompassJsonSchemaValidation.Store');
}

export default CompassJsonSchemaValidationPlugin;
export { activate, deactivate };
