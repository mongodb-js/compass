import React from 'react';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from 'hadron-app-registry';
import type { ActivateHelpers } from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import { InstancesContext } from './provider';
import { createInstancesStore } from './stores';
import {
  connectionsManagerLocator,
  type ConnectionsManager,
} from '@mongodb-js/compass-connections/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

interface MongoDBInstancesProviderProps {
  children: React.ReactNode;
  instances: Record<ConnectionInfo['id'], MongoDBInstance>;
}

function MongoDBInstancesProvider({
  children,
  instances,
}: MongoDBInstancesProviderProps) {
  return (
    <InstancesContext.Provider value={instances}>
      {children}
    </InstancesContext.Provider>
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
    component: MongoDBInstancesProvider as React.FunctionComponent<
      Omit<MongoDBInstancesProviderProps, 'instances'>
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
