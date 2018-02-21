import 'any-observable/register/rxjs';
import './rx-operators';

import ImportExportPlugin from './plugin';
import ImportExportStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Import/Export',
  component: ImportExportPlugin
};

/**
 * Activate all the components in the Import Export package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('ImportExport.Control', ROLE);
  appRegistry.registerStore('ImportExport.Store', ImportExportStore);
}

/**
 * Deactivate all the components in the Import Export package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('ImportExport.Control', ROLE);
  appRegistry.deregisterStore('ImportExport.Store');
}

export default ImportExportPlugin;
export { activate, deactivate };
