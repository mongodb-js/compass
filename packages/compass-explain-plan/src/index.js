import ExplainPlanPlugin from './plugin';
import ExplainPlanStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = { name: 'ExplainPlan', component: ExplainPlanPlugin };

/**
 * Activate all the components in the Explain Plan package.
 *
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Tab', ROLE);
  appRegistry.registerStore('ExplainPlan.Store', ExplainPlanStore);
}

/**
 * Deactivate all the components in the Explain Plan package.
 *
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
  appRegistry.deregisterStore('ExplainPlan.Store');
}

export default ExplainPlanPlugin;
export { activate, deactivate };
