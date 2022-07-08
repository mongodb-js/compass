import React, { useRef } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import type { DataServiceManager } from '../services/data-service-manager';
import { useDataServiceManager } from '../services/data-service-manager';
import type { CompassLogging } from '../services/logging';
import { useCompassLogging } from '../services/logging';
import savedAggregationsQueries from './saved-aggregations-queries';
import currentConnection from './current-connection';
import instanceInfo from './instance-info';
import databases from './databases';
import collections from './collections';
import type { SavedAggregationsQueriesService } from '../services/saved-aggregations-queries';
import { useSavedAggregationsQueriesService } from '../services/saved-aggregations-queries';
import type { AppRegistry } from '../services/app-registry';
import { useAppRegistry } from '../services/app-registry';
import { actionManager } from '../util';

type Services = {
  appRegistry: AppRegistry;
  savedAggregationsQueriesService: SavedAggregationsQueriesService;
  createLoggerAndTelemetry: CompassLogging;
  dataServiceManager: DataServiceManager;
};

export type ThunkOptions = {
  extra: Services;
  state: RootState;
  dispatch: RootDispatch;
};

function createCompassStore(services: Services) {
  return configureStore({
    reducer: {
      savedAggregationsQueries,
      currentConnection,
      instanceInfo,
      databases,
      collections,
    },
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware({
        thunk: {
          extraArgument: services,
        },
      }).concat(() => (next) => (action) => {
        if (actionManager.isDebouncedAction(action)) {
          // Short-circuit and just return right away if we are handling
          // debounced action
          return action;
        }
        next(action);
      });
    },
    devTools: process.env.NODE_ENV === 'development',
  });
}

export type RootStore = ReturnType<typeof createCompassStore>;

export type RootState = ReturnType<RootStore['getState']>;

export type RootDispatch = RootStore['dispatch'];

function useCompassStore(): RootStore {
  const savedAggregationsQueriesService = useSavedAggregationsQueriesService();
  const appRegistry = useAppRegistry();
  const dataServiceManager = useDataServiceManager();
  const createLoggerAndTelemetry = useCompassLogging();
  const store = useRef<RootStore>();
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
  return <Provider store={store}>{children}</Provider>;
};
