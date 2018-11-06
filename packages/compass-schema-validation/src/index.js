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
