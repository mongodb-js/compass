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
import {
  type AtlasAuthService,
  atlasAuthServiceLocator,
} from '@mongodb-js/atlas-service/provider';
import { AtlasClusterConnectionsOnly } from './components/multiple-connections/connections-navigation';

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
        atlasAuthService,
      }: {
        globalAppRegistry: AppRegistry;
        connections: ConnectionsService;
        instancesManager: MongoDBInstancesManager;
        logger: Logger;
        atlasAuthService: AtlasAuthService;
      },
      helpers: ActivateHelpers
    ) {
      const { store, deactivate } = createSidebarStore(
        {
          globalAppRegistry,
          connections,
          instancesManager,
          logger,
          atlasAuthService,
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
    atlasAuthService: atlasAuthServiceLocator,
  }
);

export const AtlasClusterConnectionsOnlyProvider =
  AtlasClusterConnectionsOnly.Provider;
