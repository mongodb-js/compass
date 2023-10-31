import { legacy_createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { appRegistryActivated } from '../modules/app-registry';
import { dataServiceConnected } from '../modules/data-service';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import rootReducer, {
  open,
} from '../modules/rename-collection/rename-collection';

const store = legacy_createStore(rootReducer, applyMiddleware(thunk));

// @ts-expect-error No `onActivated` property exists on the store
store.onActivated = (appRegistry: AppRegistry) => {
  store.dispatch(appRegistryActivated(appRegistry));
  /**
   * Set the data service in the store when connected.
   *
   * @param {Error} error - The error.
   * @param {DataService} dataService - The data service.
   */
  appRegistry.on(
    'data-service-connected',
    (error: Error | null, dataService: DataService) => {
      store.dispatch(dataServiceConnected(error, dataService));
    }
  );

  /**
   * When needing to rename a collection from somewhere, the `open-rename-collection` event is emitted.
   *
   * @param {String} name - The database name.
   */
  appRegistry.on(
    'open-rename-collection',
    (ns: { database: string; collection: string }) => {
      store.dispatch(open(ns.database, ns.collection));
    }
  );
};

export default store;
