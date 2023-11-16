import { legacy_createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { appRegistryActivated } from '../modules/app-registry';
import { dataServiceConnected } from '../modules/data-service';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import rootReducer, {
  open,
} from '../modules/rename-collection/rename-collection';

export function activateRenameCollectionPlugin(
  _,
  { globalAppRegistry }: { globalAppRegistry: AppRegistry }
) {
  const store = legacy_createStore(rootReducer, applyMiddleware(thunk));

  store.dispatch(appRegistryActivated(globalAppRegistry));

  const onDataServiceConnected = (
    error: Error | null,
    dataService: DataService
  ) => {
    store.dispatch(dataServiceConnected(error, dataService));
  };

  globalAppRegistry.on('data-service-connected', onDataServiceConnected);

  const onRenameCollection = (ns: { database: string; collection: string }) => {
    store.dispatch(open(ns.database, ns.collection));
  };
  globalAppRegistry.on('open-rename-collection', onRenameCollection);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'data-service-connected',
        onDataServiceConnected
      );
      globalAppRegistry.removeListener(
        'open-rename-collection',
        onRenameCollection
      );
    },
  };
}
