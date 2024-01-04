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

export type CollectionTabOptions = {
  /**
   * Collection namespace
   */
  namespace: string;
  /**
   * Initial query to be set in the query bar
   */
  initialQuery?: unknown;
  /**
   * Initial saved sggregation (stored on disk) to apply to the agg builder
   */
  initialAggregation?: unknown;
  /**
   * Initial aggregation pipeline to set in the agg builder
   */
  initialPipeline?: unknown[];
  /**
   * Initial stringified aggregation pipeline to set in the agg builder
   */
  initialPipelineText?: string;
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
  {
    namespace,
    initialAggregation,
    initialPipeline,
    initialPipelineText,
    editViewName,
  }: CollectionTabOptions,
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

  // If aggregation is passed or we opened souce of a view collection to edit
  // pipeline, select aggregation tab right away
  const currentTab =
    initialAggregation || initialPipeline || initialPipelineText || editViewName
      ? 'Aggregations'
      : 'Documents';

  const store = createStore(
    reducer,
    {
      namespace,
      metadata: null,
      stats: pickCollectionStats(collectionModel),
      editViewName,
      currentTab,
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
