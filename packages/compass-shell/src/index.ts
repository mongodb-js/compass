import type { Logger } from '@mongodb-js/compass-logging/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { ShellPlugin, onActivated } from './plugin';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  type ConnectionInfoAccess,
  connectionInfoAccessLocator,
  dataServiceLocator,
  type DataService,
  type ConnectionScopedTrackFunction,
} from '@mongodb-js/compass-connections/provider';
import {
  preferencesLocator,
  type PreferencesAccess,
} from 'compass-preferences-model/provider';
import { type WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { createConnectionScopedTelemetryLocator } from '@mongodb-js/compass-connections/dist/connection-scoped-telemetry';

export const CompassShellPlugin = registerHadronPlugin<
  unknown,
  {
    logger: () => Logger;
    track: () => ConnectionScopedTrackFunction;
    dataService: () => DataService;
    preferences: () => PreferencesAccess;
    connectionInfoAccess: () => ConnectionInfoAccess;
  }
>(
  {
    name: 'CompassShell',
    component: ShellPlugin,
    activate: onActivated,
  },
  {
    logger: createLoggerLocator('COMPASS-SHELL'),
    track: createConnectionScopedTelemetryLocator(),
    dataService: dataServiceLocator,
    preferences: preferencesLocator,
    connectionInfoAccess: connectionInfoAccessLocator,
  }
);

export const WorkspaceTab: WorkspaceComponent<'Shell'> = {
  name: 'Shell' as const,
  component: CompassShellPlugin,
};
