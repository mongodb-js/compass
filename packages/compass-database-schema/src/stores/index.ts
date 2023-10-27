import type { AnyAction } from 'redux';
import { applyMiddleware, createStore } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { RootState } from '../modules';
import reducer from '../modules';
import type { ThunkDispatch } from 'redux-thunk';
import thunk from 'redux-thunk';
import * as hadronAppRegistry from 'hadron-app-registry';
import {
  connectDataService,
  disconnectDataService,
} from '../modules/data-service';

import { selectDatabase } from '../modules/database-schema';

export type ConfigureStoreOptions = {
  globalAppRegistry: AppRegistry;
};

export type DatabaseSchemaStore = ReturnType<typeof configureStore>;
export type DatabaseSchemaThunkDispatch = ThunkDispatch<
  RootState,
  never,
  AnyAction
>;

let databaseSchemaStore: DatabaseSchemaStore;

const configureStore = ({ globalAppRegistry }: ConfigureStoreOptions) => {
  const store = createStore(
    reducer,
    {},
    applyMiddleware(thunk.withExtraArgument({}))
  );

  // Set the app registry if preset. This must happen first.
  if (globalAppRegistry) {
    globalAppRegistry.on(
      'data-service-connected',
      (err: Error | undefined, dataService: DataService) => {
        store.dispatch(connectDataService(dataService));
      }
    );

    globalAppRegistry.on('select-database', (dbName: string) => {
      store.dispatch(selectDatabase(dbName));
    });

    globalAppRegistry.on('data-service-disconnected', () => {
      store.dispatch(disconnectDataService());
    });
  }

  databaseSchemaStore = store;
  return store;
};

export function getStore() {
  databaseSchemaStore ??= configureStore({
    globalAppRegistry: hadronAppRegistry.globalAppRegistry,
  });

  return databaseSchemaStore;
}

export default configureStore;
