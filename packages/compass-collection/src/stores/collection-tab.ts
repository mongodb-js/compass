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

export type CollectionTabOptions = {
  dataService: DataService;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  query?: unknown;
  aggregation?: unknown;
  editViewName?: string;
} & CollectionMetadata;

export function configureStore(options: CollectionTabOptions) {
  const {
    dataService,
    globalAppRegistry,
    localAppRegistry,
    query,
    aggregation,
    editViewName,
    ...collectionMetadata
  } = options;

  const instance = (
    globalAppRegistry.getStore('App.InstanceStore') as
      | {
          getInstance(): MongoDBInstance;
        }
      | undefined
  )?.getInstance();

  if (!instance) {
    throw new Error('Expected to get instance from App.InstanceStore');
  }

  const configureFieldStore = globalAppRegistry.getStore('Field.Store') as (
    ...args: any
  ) => void | undefined; // our handcrafted d.ts file doesn't match the actual code

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
      // If aggregation is passed or we opened view to edit source pipeline,
      // select aggregation tab right away
      currentTab: aggregation || editViewName ? 'Aggregations' : 'Documents',
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

  collectionModel?.on('change:status', (model: Collection, status: string) => {
    if (status === 'ready') {
      store.dispatch(collectionStatsFetched(model));
    }
  });

  localAppRegistry.on('open-create-index-modal', () => {
    store.dispatch(selectTab('Indexes'));
  });

  localAppRegistry.on('generate-aggregation-from-query', () => {
    store.dispatch(selectTab('Aggregations'));
  });

  return store;
}
