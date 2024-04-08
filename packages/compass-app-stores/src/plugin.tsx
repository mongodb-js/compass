import React from 'react';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from 'hadron-app-registry';
import type { ActivateHelpers } from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import { MongoDBInstancesManagerContext } from './provider';
import { createInstancesStore } from './stores';
import {
  connectionsManagerLocator,
  type ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import { type MongoDBInstancesManager } from './instances-manager';

interface MongoDBInstancesProviderProps {
  children: React.ReactNode;
  instancesManager: MongoDBInstancesManager;
}

function MongoDBInstancesManagerProvider({
  children,
  instancesManager,
}: MongoDBInstancesProviderProps) {
  return (
    <MongoDBInstancesManagerContext.Provider value={instancesManager}>
      {children}
    </MongoDBInstancesManagerContext.Provider>
  );
}

export const CompassInstanceStorePlugin = registerHadronPlugin<
  { children: React.ReactNode },
  {
    logger: () => LoggerAndTelemetry;
    connectionsManager: () => ConnectionsManager;
  }
>(
  {
    name: 'CompassInstanceStore',
    component: MongoDBInstancesManagerProvider as React.FunctionComponent<
      Omit<MongoDBInstancesProviderProps, 'instancesManager'>
    >,
    activate(
      _: unknown,
      {
        connectionsManager,
        logger,
        globalAppRegistry,
      }: {
        connectionsManager: ConnectionsManager;
        logger: LoggerAndTelemetry;
        globalAppRegistry: AppRegistry;
      },
      helpers: ActivateHelpers
    ) {
      const store = createInstancesStore(
        {
          connectionsManager,
          logger,
          globalAppRegistry,
        },
        helpers
      );
      return {
        store,
        deactivate: () => {
          store.deactivate();
        },
      };
    },
  },
  {
    logger: createLoggerAndTelemetryLocator('COMPASS-INSTANCE-STORE'),
    connectionsManager: connectionsManagerLocator,
  }
);
