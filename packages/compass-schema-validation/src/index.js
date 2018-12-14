import CompassSchemaValidationPlugin from './plugin';
import CompassSchemaValidationStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Validation',
  component: CompassSchemaValidationPlugin
};

/**
 * Activate all the components in the Compass Json Schema Validation package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Tab', ROLE);
  appRegistry.registerStore('CompassSchemaValidation.Store', CompassSchemaValidationStore);
}

/**
 * Deactivate all the components in the Compass Json Schema Validation package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
  appRegistry.deregisterStore('CompassSchemaValidation.Store');
}

export default CompassSchemaValidationPlugin;
export { activate, deactivate };
