import { registerHadronPlugin } from 'hadron-app-registry';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import DocsChatbotComponent from './components/docs-chatbot-workspace';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import { activateDocsChatbotPlugin } from './store';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import DocsChatbotSidebar from './components/docs-chatbot-sidebar';

// TODO: Where is the context where both of these are rendered?

const DocsChatbotPlugin = registerHadronPlugin(
  {
    name: 'DocsChatbot',
    component: DocsChatbotComponent,
    activate: activateDocsChatbotPlugin,
  },
  {
    preferences: preferencesLocator,
    connections: connectionsLocator,
    instanceManager: mongoDBInstancesManagerLocator,
    workspaces: workspacesServiceLocator,
    track: telemetryLocator,
    logger: createLoggerLocator('COMPASS-DOCS-CHATBOT'),
  }
);

const DocsChatbotSidebarPlugin = registerHadronPlugin(
  {
    name: 'DocsChatbot',
    component: DocsChatbotSidebar,
    activate: activateDocsChatbotPlugin,
  },
  {
    preferences: preferencesLocator,
    connections: connectionsLocator,
    instanceManager: mongoDBInstancesManagerLocator,
    workspaces: workspacesServiceLocator,
    track: telemetryLocator,
    logger: createLoggerLocator('COMPASS-DOCS-CHATBOT'),
  }
);

export const WorkspaceTab: WorkspaceComponent<'Docs Chatbot'> = {
  name: 'Docs Chatbot' as const,
  component: DocsChatbotPlugin,
};

export { DocsChatbotPlugin, DocsChatbotSidebarPlugin };
