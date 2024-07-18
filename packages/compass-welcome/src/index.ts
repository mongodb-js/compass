import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { WelcomeModal, WelcomeTab } from './components';
import { activatePlugin } from './stores';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';

const serviceLocators = {
  logger: createLoggerLocator('COMPASS-MY-QUERIES-UI'),
  track: telemetryLocator,
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
