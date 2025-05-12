import { registerHadronPlugin } from 'hadron-app-registry';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';

import { MCPContent } from './components';
import { activateMCPStore } from './store';

const MCPPlugin = registerHadronPlugin(
  {
    name: 'DataModeling',
    component: MCPContent,
    activate: activateMCPStore,
  },
  {
    preferences: preferencesLocator,
    connections: connectionsLocator,
    instanceManager: mongoDBInstancesManagerLocator,
    track: telemetryLocator,
    logger: createLoggerLocator('COMPASS-MCP'),
  }
);

export const WorkspaceTab: WorkspaceComponent<'Data Chat'> = {
  name: 'Data Chat',
  component: MCPPlugin,
};

export default MCPPlugin;
