import CompassSchemaValidationPlugin from './plugin';
import configureStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Validation',
  component: CompassSchemaValidationPlugin,
  configureStore: configureStore,
  configureActions: () => {},
  storeName: 'CompassSchemaValidation.Store',
  actionName: 'CompassSchemaValidation.Action'
};

/**
 * Activate all the components in the Compass Json Schema Validation package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Tab', ROLE);
}

/**
 * Deactivate all the components in the Compass Json Schema Validation package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
}

export default CompassSchemaValidationPlugin;
export { activate, deactivate, configureStore };
