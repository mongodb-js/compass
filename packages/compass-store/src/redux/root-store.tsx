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
        // NB: Redux is not built to store "non-serializable" values in the
        // store and so RTK comes with a built-in middleware that checks that we
        // are not storing non-serializable values in stores and return them
        // from the action creators. In some cases this check is helpful and
        // highlights the cases where we are doing things "wrong", like
        // returning dataService directly from the `connect` action to make
        // connection form work. At the same time we do have a lot of state in
        // the application that redux considers non-serializable ie. all the
        // bson type values and as this check generates a ton of noize and there
        // is no way to teach redux that bson values we store can be serialized
        // this check is disabled, otherwise the console turns into a
        // never-ending stream of errors from redux
        serializableCheck: false,
      }).prepend(() => (next) => (action) => {
        // Short-circuit and return the debounced action promise immediately,
        // redux will throw if anything that is not a plain object will get to
        // the main redux action handling middleware
        if (actionManager.isDebouncedAction(action)) {
          return action;
        }
        return next(action);
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
    store.current = (globalThis as any).rootStore = createCompassStore({
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
