import ExplainPlanPlugin from './plugin';
import configureStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Explain Plan',
  component: ExplainPlanPlugin,
  order: 4,
  configureStore: configureStore,
  configureActions: () => {},
  storeName: 'ExplainPlan.Store'
};

/**
 * Activate all the components in the Explain Plan package.
 *
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Tab', ROLE);
}

/**
 * Deactivate all the components in the Explain Plan package.
 *
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
}

export default ExplainPlanPlugin;
export { activate, deactivate, configureStore };
