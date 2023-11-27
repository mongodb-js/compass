import { legacy_createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import reducer, { open } from '../modules/rename-collection/rename-collection';

export type RenameCollectionPluginServices = {
  dataService: Pick<DataService, 'renameCollection'>;
  globalAppRegistry: AppRegistry;
};

export function activateRenameCollectionPlugin(
  _: unknown,
  { globalAppRegistry, dataService }: RenameCollectionPluginServices
) {
  const store = legacy_createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        dataService,
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
