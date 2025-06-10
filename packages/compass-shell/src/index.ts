import React from 'react';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { ShellPlugin, onActivated } from './plugin';
import { registerHadronPlugin } from 'hadron-app-registry';
import { preferencesLocator } from 'compass-preferences-model/provider';
import type { WorkspacePlugin } from '@mongodb-js/compass-workspaces';
import {
  dataServiceLocator,
  type DataService,
  connectionInfoRefLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { WorkspaceName, ShellPluginTitle } from './shell-plugin-title';

export const WorkspaceTab: WorkspacePlugin<typeof WorkspaceName> = {
  name: WorkspaceName,
  provider: registerHadronPlugin(
    {
      name: WorkspaceName,
      component: function ShellProvider({ children }) {
        return React.createElement(React.Fragment, null, children);
      },
      activate: onActivated,
    },
    {
      logger: createLoggerLocator('COMPASS-SHELL'),
      track: telemetryLocator,
      dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
      connectionInfo: connectionInfoRefLocator,
      preferences: preferencesLocator,
    }
  ),
  content: ShellPlugin,
  header: ShellPluginTitle(),
};
