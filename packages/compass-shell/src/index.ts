import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { ShellPlugin, onActivated } from './plugin';
import { registerHadronPlugin } from 'hadron-app-registry';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { type WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import {
  dataServiceLocator,
  type DataService,
  connectionInfoRefLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';

export const CompassShellPlugin = registerHadronPlugin(
  {
    name: 'CompassShell',
    component: ShellPlugin,
    activate: onActivated,
  },
  {
    logger: createLoggerLocator('COMPASS-SHELL'),
    track: telemetryLocator,
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
    connectionInfo: connectionInfoRefLocator,
    preferences: preferencesLocator,
  }
);

export const WorkspaceTab: WorkspaceComponent<'Shell'> = {
  name: 'Shell' as const,
  component: CompassShellPlugin,
};
