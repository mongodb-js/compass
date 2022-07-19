import React, { useRef } from 'react';
import type { Instance } from 'mobx-state-tree';
import { types } from 'mobx-state-tree';
import makeInspectable from 'mobx-devtools-mst';
import type { DataServiceManager } from '../services/data-service-manager';
import { useDataServiceManager } from '../services/data-service-manager';
import type { CompassLogging } from '../services/logging';
import { useCompassLogging } from '../services/logging';
import type { SavedAggregationsQueriesService } from '../services/saved-aggregations-queries';
import { useSavedAggregationsQueriesService } from '../services/saved-aggregations-queries';
import type { AppRegistry } from '../services/app-registry';
import { useAppRegistry } from '../services/app-registry';
import { RootStoreContext } from './root-store-context';
import { CurrentConnectionModel } from './current-connection';
import { DatabasesModel } from './databases';
import { MongoDBInstanceInfoModel } from './instance-info';

export type Services = {
  appRegistry: AppRegistry;
  savedAggregationsQueriesService: SavedAggregationsQueriesService;
  createLoggerAndTelemetry: CompassLogging;
  dataServiceManager: DataServiceManager;
};

const RootModel = types.model({
  currentConnection: types.optional(CurrentConnectionModel, {}),
  databases: types.optional(DatabasesModel, {}),
  instance: types.optional(MongoDBInstanceInfoModel, {})
});

export type RootInstance = Instance<typeof RootModel>;

function createCompassStore(services: Services) {
  const root = RootModel.create({}, services);
  makeInspectable(root);
  return root;
}

export function useCompassStore(): RootInstance {
  const savedAggregationsQueriesService = useSavedAggregationsQueriesService();
  const appRegistry = useAppRegistry();
  const dataServiceManager = useDataServiceManager();
  const createLoggerAndTelemetry = useCompassLogging();
  const store = useRef<RootInstance>();
  if (!store.current) {
    store.current = createCompassStore({
      savedAggregationsQueriesService,
      dataServiceManager,
      appRegistry,
      createLoggerAndTelemetry,
    });
  }
  return store.current;
}

export const CompassStoreProvider: React.FunctionComponent = ({ children }) => {
  const store = useCompassStore();
  return (
    <RootStoreContext.Provider value={store}>
      {children}
    </RootStoreContext.Provider>
  );
};
