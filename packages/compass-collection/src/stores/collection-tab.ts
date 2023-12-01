import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  collectionStatsFetched,
  pickCollectionStats,
  selectTab,
} from '../modules/collection-tab';
import type Collection from 'mongodb-collection-model';
import toNs from 'mongodb-ns';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type { ActivateHelpers } from 'hadron-app-registry';

export type CollectionTabOptions = {
  query?: unknown;
  aggregation?: unknown;
  pipelineText?: string;
  editViewName?: string;
} & CollectionMetadata; // TODO: make collection-tab resovle metadata on its own

export type CollectionTabServices = {
  dataService: DataService;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  instance: MongoDBInstance;
};

export function activatePlugin(
  options: CollectionTabOptions,
  services: CollectionTabServices,
  { on, cleanup }: ActivateHelpers
) {
  const {
    query,
    aggregation,
    editViewName,
    pipelineText,
    ...collectionMetadata
  } = options;

  const { dataService, globalAppRegistry, localAppRegistry, instance } =
    services;

  const configureFieldStore = globalAppRegistry.getStore(
    'Field.Store'
  ) as unknown as (...args: any) => void | undefined; // Field.Store is odd because it registers a configure method, not the actual store

  configureFieldStore?.({
    localAppRegistry: localAppRegistry,
    globalAppRegistry: globalAppRegistry,
    namespace: collectionMetadata.namespace,
    serverVersion: instance.build.version,
  });

  const { database, collection } = toNs(collectionMetadata.namespace);

  const collectionModel = instance.databases
    .get(database)
    ?.collections.get(collection, 'name');

  // If aggregation is passed or we opened view to edit source pipeline,
  // select aggregation tab right away
  const currentTab =
    aggregation || editViewName || pipelineText ? 'Aggregations' : 'Documents';

  const store = createStore(
    reducer,
    {
      metadata: {
        ...collectionMetadata,
        // NB: While it's technically possible for these values to change during
        // MongoDB server lifecycle, we (mostly) never accounted for this in the
        // scope of collection tab plugin and its children plugins. The cases
        // where this can happen are rare, so we are okay with just ignoring
        // this at the moment. If we ever decide to change that, don't forget to
        // account for that change in all plugins that implement
        // `Collection.Tab` and `Collection.ScopedModal` roles
        isDataLake: instance.dataLake.isDataLake,
        isAtlas: instance.env === 'atlas',
        serverVersion: instance.build.version,
      },
      stats: collectionModel ? pickCollectionStats(collectionModel) : null,
      initialQuery: query,
      initialAggregation: aggregation,
      initialPipelineText: pipelineText,
      currentTab,
      editViewName,
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
    store.dispatch(selectTab('Indexes'));
  });

  on(localAppRegistry, 'open-create-search-index-modal', () => {
    store.dispatch(selectTab('Indexes'));
  });

  on(localAppRegistry, 'generate-aggregation-from-query', () => {
    store.dispatch(selectTab('Aggregations'));
  });

  if (collectionModel) {
    on(
      collectionModel,
      'change:status',
      (model: Collection, status: string) => {
        if (status === 'ready') {
          store.dispatch(collectionStatsFetched(model));
        }
      }
    );
  }

  return {
    store,
    deactivate: cleanup,
  };
}
