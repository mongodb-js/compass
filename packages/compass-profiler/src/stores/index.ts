import { AnyAction, applyMiddleware, createStore } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import reducer, { RootState } from '../modules';
import { localAppRegistryActivated } from '@mongodb-js/mongodb-redux-common/app-registry';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { globalAppRegistry } from 'hadron-app-registry';
import {
  chooseNamespace,
  connectDataService,
  disconnectDataService,
} from '../modules/data-service';
import { refreshDatabaseList } from '../modules/profiler-state';

export type ConfigureStoreOptions = {
  globalAppRegistry: AppRegistry;
};

export type ProfilerStore = ReturnType<typeof configureStore>;
export type ProfilerThunkDispatch = ThunkDispatch<RootState, never, AnyAction>;

let profilerStore: ProfilerStore;

const configureStore = (options: ConfigureStoreOptions) => {
  const store = createStore(
    reducer,
    {},
    applyMiddleware(thunk.withExtraArgument({}))
  );

  // Set the app registry if preset. This must happen first.
  if (options.globalAppRegistry) {
    options.globalAppRegistry.on(
      'data-service-connected',
      (err: Error | undefined, dataService: DataService) => {
        store.dispatch(connectDataService(dataService));
      }
    );

    options.globalAppRegistry.on('select-namespace', (metadata) => {
      if (!metadata.namespace) {
        return;
      }

      store.dispatch(chooseNamespace(metadata.namespace as string));
    });

    options.globalAppRegistry.on('instance-created', ({ instance }) => {
      store.dispatch(
        refreshDatabaseList(instance.databases.map((db) => db.name))
      );

      instance.on('change:databases', () => {
        store.dispatch(
          refreshDatabaseList(instance.databases.map((db) => db.name))
        );
      });

      instance.on('change:databases.collectionsStatus', () => {
        store.dispatch(
          refreshDatabaseList(instance.databases.map((db) => db.name))
        );
      });
    });

    options.globalAppRegistry.on('data-service-disconnected', () => {
      store.dispatch(disconnectDataService());
    });
  }

  profilerStore = store;
  return store;
};

export function getStore() {
  profilerStore ??= configureStore({
    globalAppRegistry,
  });

  return profilerStore;
}

export default configureStore;
