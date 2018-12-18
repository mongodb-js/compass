import MetricsStore from 'stores';

/**
 * Activate all the components in the Metrics package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerStore('Metrics.Store', MetricsStore);
}

/**
 * Deactivate all the components in the Metrics package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterStore('Metrics.Store');
}

export { activate, deactivate };
