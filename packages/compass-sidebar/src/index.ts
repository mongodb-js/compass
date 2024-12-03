import type { ActivateHelpers } from 'hadron-app-registry';
import { registerHadronPlugin, type AppRegistry } from 'hadron-app-registry';
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

export const CompassSidebarPlugin = registerHadronPlugin(
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
      }: {
        globalAppRegistry: AppRegistry;
        connections: ConnectionsService;
        instancesManager: MongoDBInstancesManager;
        logger: Logger;
      },
      helpers: ActivateHelpers
    ) {
      const { store, deactivate } = createSidebarStore(
        {
          globalAppRegistry,
          connections,
          instancesManager,
          logger,
        },
        helpers
      );
      return {
        store,
        deactivate,
      };
    },
  },
  {
    connections: connectionsLocator,
    instancesManager: mongoDBInstancesManagerLocator,
    logger: createLoggerLocator('COMPASS-SIDEBAR-UI'),
  }
);
