import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { WorkspacePlugin } from '@mongodb-js/compass-workspaces';
import { WelcomeModal, DesktopWelcomeTab, WebWelcomeTab } from './components';
import { activatePlugin } from './stores';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';

const serviceLocators = {
  logger: createLoggerLocator('COMPASS-MY-QUERIES-UI'),
  track: telemetryLocator,
  workspaces: workspacesServiceLocator,
};

const WorkspaceName = 'Welcome' as const;

export const DesktopWorkspaceTab: WorkspacePlugin<typeof WorkspaceName> = {
  name: WorkspaceName,
  provider: registerHadronPlugin(
    {
      name: WorkspaceName,
      component: function WelcomeProvider({ children }) {
        return React.createElement(React.Fragment, null, children);
      },
      activate: activatePlugin,
    },
    serviceLocators
  ),
  content: DesktopWelcomeTab,
  header: ({
    // WorkspaceTabProps
    id,
  }: {
    id: string;
  }) =>
    ({
      id,
      type: WorkspaceName,
      title: WorkspaceName,
      iconGlyph: 'Logo',
    } as const),
};

export const WebWorkspaceTab: WorkspacePlugin<typeof WorkspaceName> = {
  name: WorkspaceName,
  provider: registerHadronPlugin(
    {
      name: WorkspaceName,
      component: function WelcomeProvider({ children }) {
        return React.createElement(React.Fragment, null, children);
      },
      activate: activatePlugin,
    },
    serviceLocators
  ),
  content: WebWelcomeTab,
  header: ({
    // WorkspaceTabProps
    id,
  }: {
    id: string;
  }) =>
    ({
      id,
      type: WorkspaceName,
      title: WorkspaceName,
      iconGlyph: 'Logo',
    } as const),
};

export { WelcomeModal };
