import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { WelcomeModal, DesktopWelcomeTab, WebWelcomeTab } from './components';
import { activatePlugin } from './stores';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';

const serviceLocators = {
  logger: createLoggerLocator('COMPASS-MY-QUERIES-UI'),
  track: telemetryLocator,
  workspaces: workspacesServiceLocator,
};

export const DesktopWorkspaceTab: WorkspaceComponent<'Welcome'> = {
  name: 'Welcome' as const,
  component: registerHadronPlugin(
    {
      name: 'Welcome',
      component: DesktopWelcomeTab,
      activate: activatePlugin,
    },
    serviceLocators
  ),
};

export const WebWorkspaceTab: WorkspaceComponent<'Welcome'> = {
  name: 'Welcome' as const,
  component: registerHadronPlugin(
    {
      name: 'Welcome',
      component: WebWelcomeTab,
      activate: activatePlugin,
    },
    serviceLocators
  ),
};

export { WelcomeModal };
