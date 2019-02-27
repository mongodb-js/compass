import FieldStore from 'stores';

/**
 * Activate all the components in the Field Store package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerStore('Field.Store', FieldStore);
}

/**
 * Deactivate all the components in the Field Store package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterStore('Field.Store');
}

export { activate, deactivate };
