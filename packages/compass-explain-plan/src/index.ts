import ExplainPlanModal from './components/explain-plan-modal';
import { configureStore as configureModalStore } from './stores/explain-plan-modal-store';
import type { AppRegistry } from 'hadron-app-registry';

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
function activate(appRegistry: AppRegistry) {
  appRegistry.registerRole('Collection.ScopedModal', SCOPED_MODAL_ROLE);
}

/**
 * Deactivate all the components in the Explain Plan package.
 *
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry) {
  appRegistry.deregisterRole('Collection.ScopedModal', SCOPED_MODAL_ROLE);
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
