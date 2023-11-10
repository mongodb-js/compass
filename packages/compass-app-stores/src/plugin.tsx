import React from 'react';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import { InstanceContext } from './provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import type { DataService } from 'mongodb-data-service';
import { createInstanceStore } from './stores';

interface InstanceStoreProviderProps {
  children: React.ReactNode;
  instance: MongoDBInstance;
}

function InstanceStoreProvider({
  children,
  instance,
}: InstanceStoreProviderProps) {
  return (
    <InstanceContext.Provider value={instance}>
      {children}
    </InstanceContext.Provider>
  );
}

export const CompassInstanceStorePlugin = registerHadronPlugin<
  { children: React.ReactNode },
  { logger: () => LoggerAndTelemetry; dataService: () => DataService }
>(
  {
    name: 'CompassInstanceStore',
    component: InstanceStoreProvider as React.FunctionComponent<
      Omit<InstanceStoreProviderProps, 'instance'>
    >,
    activate(
      _: unknown,
      {
        dataService,
        logger,
        globalAppRegistry,
      }: {
        dataService: DataService;
        logger: LoggerAndTelemetry;
        globalAppRegistry: AppRegistry;
      }
    ) {
      const store = createInstanceStore({
        dataService,
        logger,
        globalAppRegistry,
      });
      // TODO(COMPASS-7442): Remove the store register/register calls
      globalAppRegistry.registerStore('App.InstanceStore', store);
      return {
        store,
        deactivate: () => {
          globalAppRegistry.deregisterStore('App.InstanceStore');
          store.deactivate();
        },
      };
    },
  },
  {
    logger: createLoggerAndTelemetryLocator('COMPASS-INSTANCE-STORE'),
    dataService: dataServiceLocator,
  }
);
