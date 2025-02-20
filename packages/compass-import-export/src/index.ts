import { registerHadronPlugin } from 'hadron-app-registry';
import ImportPluginComponent from './import-plugin';
import { activatePlugin as activateImportPlugin } from './stores/import-store';
import ExportPluginComponent from './export-plugin';
import { activatePlugin as activateExportPlugin } from './stores/export-store';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';

/**
 * The import plugin.
 */
export const ImportPlugin = registerHadronPlugin(
  {
    name: 'Import',
    component: ImportPluginComponent,
    activate: activateImportPlugin,
  },
  {
    connections: connectionsLocator,
    workspaces: workspacesServiceLocator,
    preferences: preferencesLocator,
    logger: createLoggerLocator('COMPASS-IMPORT-UI'),
    track: telemetryLocator,
  }
);

/**
 * The export plugin.
 */
export const ExportPlugin = registerHadronPlugin(
  {
    name: 'Export',
    component: ExportPluginComponent,
    activate: activateExportPlugin,
  },
  {
    connections: connectionsLocator,
    preferences: preferencesLocator,
    logger: createLoggerLocator('COMPASS-EXPORT-UI'),
    track: telemetryLocator,
  }
);
