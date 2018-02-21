import 'any-observable/register/rxjs';
import './rx-operators';

import ImportExportPlugin from './plugin';
import ImportPlugin from './import-plugin';
import ExportPlugin from './export-plugin';
import ImportExportStore from 'stores';

/**
 * The import plugin.
 */
const IMPORT_ROLE = {
  name: 'Import',
  component: ImportPlugin
};

/**
 * The export plugin.
 */
const EXPORT_ROLE = {
  name: 'Export',
  component: ExportPlugin
};

/**
 * Activate all the components in the Import Export package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerRole('Import.Modal', IMPORT_ROLE);
  appRegistry.registerRole('Export.Modal', EXPORT_ROLE);
  appRegistry.registerStore('ImportExport.Store', ImportExportStore);
}

/**
 * Deactivate all the components in the Import Export package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Import.Modal', IMPORT_ROLE);
  appRegistry.deregisterRole('Export.Modal', EXPORT_ROLE);
  appRegistry.deregisterStore('ImportExport.Store');
}

export default ImportExportPlugin;
export { activate, deactivate, ImportPlugin, ExportPlugin };
