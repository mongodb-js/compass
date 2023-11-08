import { registerHadronPlugin } from 'hadron-app-registry';
import ImportPluginComponent from './import-plugin';
import { activatePlugin as activateImportPlugin } from './stores/import-store';
import ExportPluginComponent from './export-plugin';
import { activatePlugin as activateExportPlugin } from './stores/export-store';

/**
 * The import plugin.
 */
export const ImportPlugin = registerHadronPlugin({
  name: 'Import',
  component: ImportPluginComponent,
  activate: activateImportPlugin,
});

/**
 * The export plugin.
 */
export const ExportPlugin = registerHadronPlugin({
  name: 'Export',
  component: ExportPluginComponent,
  activate: activateExportPlugin,
});

function activate(): void {
  // noop
}

function deactivate(): void {
  // noop
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
