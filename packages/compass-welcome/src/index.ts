import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { WelcomeModal, WelcomeTab } from './components';
import { activatePlugin } from './stores';

const serviceLocators = {
  logger: createLoggerAndTelemetryLocator('COMPASS-MY-QUERIES-UI'),
  workspaces: workspacesServiceLocator,
};

export const WelcomePlugin = registerHadronPlugin<
  React.ComponentProps<typeof WelcomeTab>,
  typeof serviceLocators
>(
  {
    name: 'Welcome',
    component: WelcomeTab,
    activate: activatePlugin,
  },
  serviceLocators
);

export const WorkspaceTab: WorkspaceComponent<'Welcome'> = {
  name: 'Welcome' as const,
  component: WelcomePlugin,
};

export { WelcomeModal };

export default WelcomePlugin;
