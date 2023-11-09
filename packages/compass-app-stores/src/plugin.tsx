import React from 'react';
import { connect } from 'react-redux';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { RootState } from './modules/instance';
import { InstanceContext } from './provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import type { DataService } from 'mongodb-data-service';
import { createInstanceStore } from './stores';

interface InstanceStoreProviderProps {
  children: React.ReactNode;
  instance: MongoDBInstance | null;
}

function InstanceStoreProvider({
  children,
  instance,
}: InstanceStoreProviderProps) {
  return (
    instance && (
      <InstanceContext.Provider value={instance}>
        {children}
      </InstanceContext.Provider>
    )
  );
}

const ConnectedInstanceStoreProvider = connect(({ instance }: RootState) => ({
  instance,
}))(InstanceStoreProvider);

export const CompassInstanceStorePlugin = registerHadronPlugin<
  { children: React.ReactNode },
  { logger: () => LoggerAndTelemetry; dataService: () => DataService }
>(
  {
    name: 'CompassInstanceStore',
    component: ConnectedInstanceStoreProvider,
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
      return {
        store,
        deactivate: () => store.deactivate(),
      };
    },
  },
  {
    logger: createLoggerAndTelemetryLocator('COMPASS-INSTANCE-STORE'),
    dataService: dataServiceLocator,
  }
);
