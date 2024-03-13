import type { DataService } from 'mongodb-data-service';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  collectionMetadataFetched,
  collectionStatsFetched,
  pickCollectionStats,
} from '../modules/collection-tab';
import type Collection from 'mongodb-collection-model';
import toNs from 'mongodb-ns';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { ActivateHelpers } from 'hadron-app-registry';

export type CollectionTabOptions = {
  /**
   * Collection namespace
   */
  namespace: string;
  /**
   * View namespace that can be passed when editing view pipeline in the source
   * collection
   */
  editViewName?: string;
};

export type CollectionTabServices = {
  dataService: DataService;
  instance: MongoDBInstance;
};

export function activatePlugin(
  { namespace, editViewName }: CollectionTabOptions,
  services: CollectionTabServices,
  { on, cleanup }: ActivateHelpers
) {
  const { dataService, instance } = services;

  const { database, collection } = toNs(namespace);

  const collectionModel = instance.databases
    .get(database)
    ?.collections.get(collection, 'name');

  if (!collectionModel) {
    throw new Error(
      "Can't activate collection tab plugin without collection model"
    );
  }

  const store = createStore(
    reducer,
    {
      namespace,
      metadata: null,
      stats: pickCollectionStats(collectionModel),
      editViewName,
    },
    applyMiddleware(
      thunk.withExtraArgument({
        dataService,
      })
    )
  );

  on(collectionModel, 'change:status', (model: Collection, status: string) => {
    if (status === 'ready') {
      store.dispatch(collectionStatsFetched(model));
    }
  });

  void collectionModel.fetchMetadata({ dataService }).then((metadata) => {
    store.dispatch(collectionMetadataFetched(metadata));
  });

  return {
    store,
    deactivate: cleanup,
  };
}
