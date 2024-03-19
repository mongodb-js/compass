import React from 'react';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from 'hadron-app-registry';
import type { ActivateHelpers } from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import { InstanceContext } from './provider';
import {
  dataServiceLocator,
  type DataService,
} from '@mongodb-js/compass-connections/provider';
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
      },
      helpers: ActivateHelpers
    ) {
      const store = createInstanceStore(
        {
          dataService,
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
    dataService: dataServiceLocator,
  }
);
