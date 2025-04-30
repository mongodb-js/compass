import React from 'react';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from 'hadron-app-registry';
import type { ActivateHelpers } from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import { MongoDBInstancesManagerContext } from './provider';
import { createInstancesStore } from './stores';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { type MongoDBInstancesManager } from './instances-manager';
import type { PreferencesAccess } from 'compass-preferences-model';
import { preferencesLocator } from 'compass-preferences-model/provider';

interface MongoDBInstancesProviderProps {
  children?: React.ReactNode;
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

export const CompassInstanceStorePlugin = registerHadronPlugin(
  {
    name: 'CompassInstanceStore',
    component: MongoDBInstancesManagerProvider as React.FunctionComponent<
      Omit<MongoDBInstancesProviderProps, 'instancesManager'>
    >,
    activate(
      _: unknown,
      {
        connections,
        logger,
        preferences,
        globalAppRegistry,
      }: {
        connections: ConnectionsService;
        logger: Logger;
        preferences: PreferencesAccess;
        globalAppRegistry: AppRegistry;
      },
      helpers: ActivateHelpers
    ) {
      const store = createInstancesStore(
        {
          connections,
          logger,
          preferences,
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
    logger: createLoggerLocator('COMPASS-INSTANCE-STORE'),
    preferences: preferencesLocator,
    connections: connectionsLocator,
  }
);
