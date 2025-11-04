import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import {
  registerCompassPlugin,
  type AppRegistry,
} from '@mongodb-js/compass-app-registry';
import SidebarPlugin from './plugin';
import { createSidebarStore } from './stores';
import {
  type MongoDBInstancesManager,
  mongoDBInstancesManagerLocator,
} from '@mongodb-js/compass-app-stores/provider';

import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { AtlasClusterConnectionsOnly } from './components/multiple-connections/connections-navigation';
import {
  mcpControllerLocator,
  type MCPController,
} from '@mongodb-js/compass-generative-ai';

export const CompassSidebarPlugin = registerCompassPlugin(
  {
    name: 'CompassSidebar',
    component: SidebarPlugin,
    activate(
      _initialProps,
      {
        globalAppRegistry,
        connections,
        instancesManager,
        logger,
        mcpController,
      }: {
        globalAppRegistry: AppRegistry;
        connections: ConnectionsService;
        instancesManager: MongoDBInstancesManager;
        logger: Logger;
        mcpController: MCPController;
      },
      helpers: ActivateHelpers
    ) {
      const { store, deactivate } = createSidebarStore(
        {
          globalAppRegistry,
          connections,
          instancesManager,
          logger,
          mcpController,
        },
        helpers
      );
      return {
        store,
        state: {
          connections,
        },
        deactivate,
      };
    },
  },
  {
    connections: connectionsLocator,
    instancesManager: mongoDBInstancesManagerLocator,
    logger: createLoggerLocator('COMPASS-SIDEBAR-UI'),
    mcpController: mcpControllerLocator,
  }
);

export const AtlasClusterConnectionsOnlyProvider =
  AtlasClusterConnectionsOnly.Provider;
