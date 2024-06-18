import { registerHadronPlugin } from 'hadron-app-registry';
import { connectionsManagerLocator } from '@mongodb-js/compass-connections/provider';
import ImportPluginComponent from './import-plugin';
import { activatePlugin as activateImportPlugin } from './stores/import-store';
import ExportPluginComponent from './export-plugin';
import { activatePlugin as activateExportPlugin } from './stores/export-store';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { createTelemetryLocator } from '@mongodb-js/compass-telemetry/provider';

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
    connectionsManager: connectionsManagerLocator,
    workspaces: workspacesServiceLocator,
    preferences: preferencesLocator,
    logger: createLoggerLocator('COMPASS-IMPORT-UI'),
    track: createTelemetryLocator(),
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
    connectionsManager: connectionsManagerLocator,
    preferences: preferencesLocator,
    logger: createLoggerLocator('COMPASS-EXPORT-UI'),
    track: createTelemetryLocator(),
  }
);
