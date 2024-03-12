import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  collectionMetadataFetched,
  collectionStatsFetched,
  pickCollectionStats,
  selectTab,
} from '../modules/collection-tab';
import type Collection from 'mongodb-collection-model';
import toNs from 'mongodb-ns';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { ActivateHelpers } from 'hadron-app-registry';
import { CollectionSubtabs, type CollectionSubtab } from '../types';

export type CollectionTabOptions = {
  /**
   * Collection namespace
   */
  namespace: string;
  /**
   * Collection sub tab
   */
  subTab: CollectionSubtab;
  /**
   * View namespace that can be passed when editing view pipeline in the source
   * collection
   */
  editViewName?: string;
};

export type CollectionTabServices = {
  dataService: DataService;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  instance: MongoDBInstance;
};

export function activatePlugin(
  { namespace, editViewName, subTab }: CollectionTabOptions,
  services: CollectionTabServices,
  { on, cleanup }: ActivateHelpers
) {
  const { dataService, globalAppRegistry, localAppRegistry, instance } =
    services;

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
      currentTab: subTab,
    },
    applyMiddleware(
      thunk.withExtraArgument({
        globalAppRegistry,
        localAppRegistry,
        dataService,
      })
    )
  );

  on(localAppRegistry, 'open-create-index-modal', () => {
    store.dispatch(selectTab(CollectionSubtabs.Indexes));
  });

  on(localAppRegistry, 'open-create-search-index-modal', () => {
    store.dispatch(selectTab(CollectionSubtabs.Indexes));
  });

  on(localAppRegistry, 'generate-aggregation-from-query', () => {
    store.dispatch(selectTab(CollectionSubtabs.Aggregations));
  });

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
