import type { ActivateHelpers } from 'hadron-app-registry';
import { registerHadronPlugin, type AppRegistry } from 'hadron-app-registry';
import type { SidebarPluginProps } from './plugin';
import SidebarPlugin from './plugin';
import { createSidebarStore } from './stores';
import {
  type MongoDBInstancesManager,
  mongoDBInstancesManagerLocator,
} from '@mongodb-js/compass-app-stores/provider';
import {
  type ConnectionsManager,
  connectionsManagerLocator,
} from '@mongodb-js/compass-connections/provider';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { connectionInfoAccessLocator } from '@mongodb-js/connection-storage/provider';
import type { ConnectionInfoAccess } from '@mongodb-js/connection-storage/provider';

export const CompassSidebarPlugin = registerHadronPlugin<
  SidebarPluginProps,
  {
    connectionsManager: () => ConnectionsManager;
    instancesManager: () => MongoDBInstancesManager;
    connectionInfoAccess: () => ConnectionInfoAccess;
    logger: () => LoggerAndTelemetry;
  }
>(
  {
    name: 'CompassSidebar',
    component: SidebarPlugin,
    activate(
      // @eslint-ignore-next-line
      props: SidebarPluginProps,
      {
        globalAppRegistry,
        connectionsManager,
        instancesManager,
        logger,
      }: {
        globalAppRegistry: AppRegistry;
        connectionsManager: ConnectionsManager;
        instancesManager: MongoDBInstancesManager;
        logger: LoggerAndTelemetry;
      },
      helpers: ActivateHelpers
    ) {
      const { store, deactivate } = createSidebarStore(
        {
          globalAppRegistry,
          connectionsManager,
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
    connectionsManager: connectionsManagerLocator,
    instancesManager: mongoDBInstancesManagerLocator,
    connectionInfoAccess: connectionInfoAccessLocator,
    logger: createLoggerAndTelemetryLocator('COMPASS-SIDEBAR-UI'),
  }
);
