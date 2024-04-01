import { legacy_createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import reducer, { open } from '../modules/rename-collection/rename-collection';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type {
  FavoriteQueryStorageAccess,
  PipelineStorage,
} from '@mongodb-js/my-queries-storage/provider';

export type RenameCollectionPluginServices = {
  dataService: Pick<DataService, 'renameCollection'>;
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
  queryStorage?: FavoriteQueryStorageAccess;
  pipelineStorage?: PipelineStorage;
};

export function activateRenameCollectionPlugin(
  _: unknown,
  {
    globalAppRegistry,
    dataService,
    instance,
    queryStorage,
    pipelineStorage,
  }: RenameCollectionPluginServices
) {
  async function checkIfSavedQueriesAndAggregationsExist(
    oldNamespace: string
  ): Promise<boolean> {
    const pipelineExists = await pipelineStorage
      ?.loadAll()
      .then((pipelines) =>
        pipelines.some(({ namespace }) => namespace === oldNamespace)
      )
      .catch(() => false);
    const queryExists = await queryStorage
      ?.getStorage()
      .loadAll()
      .then((queries) => queries.some(({ _ns }) => _ns === oldNamespace))
      .catch(() => false);

    return Boolean(pipelineExists || queryExists);
  }

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
    const collections: { name: string }[] =
      instance.databases.get(ns.database)?.collections ?? [];
    void checkIfSavedQueriesAndAggregationsExist(
      `${ns.database}.${ns.collection}`
    ).then((areSavedQueriesAndAggregationsImpacted) => {
      store.dispatch(
        open({
          db: ns.database,
          collection: ns.collection,
          collections,
          areSavedQueriesAndAggregationsImpacted,
        })
      );
    });
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
