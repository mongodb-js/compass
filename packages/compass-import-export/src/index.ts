import type AppRegistry from 'hadron-app-registry';

import ImportPlugin from './import-plugin';
import ExportPlugin from './export-plugin';
import { store as exportStore } from './stores/export-store';
import { store as importStore } from './stores/import-store';

/**
 * The import plugin.
 */
const IMPORT_ROLE = {
  name: 'Import',
  component: ImportPlugin,
};

/**
 * The export plugin.
 */
const EXPORT_ROLE = {
  name: 'Export',
  component: ExportPlugin,
};

/**
 * Activate all the components in the Import Export package.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Global.Modal', EXPORT_ROLE);
  appRegistry.registerStore('ExportModal.Store', exportStore);
  appRegistry.registerRole('Global.Modal', IMPORT_ROLE);
  appRegistry.registerStore('ImportModal.Store', importStore);
}

/**
 * Deactivate all the components in the Import Export package.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Global.Modal', EXPORT_ROLE);
  appRegistry.deregisterStore('ExportModal.Store');
  appRegistry.deregisterRole('Global.Modal', IMPORT_ROLE);
  appRegistry.deregisterStore('ImportModal.Store');
}

export { activate, deactivate, ImportPlugin, ExportPlugin };
export { default as metadata } from '../package.json';
