import { legacy_createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import rootReducer, {
  open,
} from '../modules/rename-collection/rename-collection';
import type { ToastActions } from '@mongodb-js/compass-components';

export type RenameCollectionPluginServices = {
  dataService: DataService;
  globalAppRegistry: AppRegistry;
  toastService: ToastActions;
};

export function activateRenameCollectionPlugin(
  _: unknown,
  {
    globalAppRegistry,
    dataService,
    toastService,
  }: RenameCollectionPluginServices
) {
  const store = legacy_createStore(
    rootReducer,
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        dataService,
        toastService,
      })
    )
  );

  const onRenameCollection = (ns: { database: string; collection: string }) => {
    store.dispatch(open(ns.database, ns.collection));
  };
  globalAppRegistry.on('open-rename-collection', onRenameCollection);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener(
        'open-rename-collection',
        onRenameCollection
      );
    },
  };
}
