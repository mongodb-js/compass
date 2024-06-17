import type { Logger } from '@mongodb-js/compass-logging/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { ShellPlugin, onActivated } from './plugin';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  dataServiceLocator,
  type DataService,
} from '@mongodb-js/compass-connections/provider';
import {
  preferencesLocator,
  type PreferencesAccess,
} from 'compass-preferences-model/provider';
import { type WorkspaceComponent } from '@mongodb-js/compass-workspaces';

export const CompassShellPlugin = registerHadronPlugin<
  unknown,
  {
    logger: () => Logger;
    dataService: () => DataService;
    preferences: () => PreferencesAccess;
  }
>(
  {
    name: 'CompassShell',
    component: ShellPlugin,
    activate: onActivated,
  },
  {
    logger: createLoggerLocator('COMPASS-SHELL'),
    dataService: dataServiceLocator,
    preferences: preferencesLocator,
  }
);

export const WorkspaceTab: WorkspaceComponent<'Shell'> = {
  name: 'Shell' as const,
  component: CompassShellPlugin,
};
