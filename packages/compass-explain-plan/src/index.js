import ExplainPlanModal from './components/explain-plan-modal';
import { configureStore as configureModalStore } from './stores/explain-plan-modal-store';
import ExplainPlanPlugin from './plugin';
import configureStore from './stores';

const COLLECTION_TAB_ROLE = {
  name: 'Explain Plan',
  component: ExplainPlanPlugin,
  order: 4,
  configureStore: configureStore,
  configureActions: () => {},
  storeName: 'ExplainPlan.Store',
};

const SCOPED_MODAL_ROLE = {
  name: 'Explain Plan Modal',
  component: ExplainPlanModal,
  configureStore: configureModalStore,
  storeName: 'ExplainPlanModal.Store',
};

/**
 * Activate all the components in the Explain Plan package.
 *
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  appRegistry.registerRole('Collection.ScopedModal', SCOPED_MODAL_ROLE);
}

/**
 * Deactivate all the components in the Explain Plan package.
 *
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  appRegistry.deregisterRole('Collection.ScopedModal', SCOPED_MODAL_ROLE);
}

export default ExplainPlanPlugin;
export { activate, deactivate, configureStore };
export { default as metadata } from '../package.json';
