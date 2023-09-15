import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  collectionStatsFetched,
  selectTab,
} from '../modules/collection-tab';
import type Collection from 'mongodb-collection-model';
import toNs from 'mongodb-ns';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { CollectionMetadata } from 'mongodb-collection-model';

export function configureStore(
  options: {
    dataService: DataService;
    globalAppRegistry: AppRegistry;
    localAppRegistry: AppRegistry;
    query?: unknown;
    aggregation?: unknown;
    editViewName?: string;
  } & CollectionMetadata
) {
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

  const store = createStore(
    reducer,
    {
      metadata: {
        ...collectionMetadata,
        // It's safe to just read this once here on store creation because
        // instance is fully instantiated and instance details are fetched at
        // the point when tab is created
        isDataLake: instance.dataLake.isDataLake,
        isAtlas: instance.isAtlas,
        serverVersion: instance.build.version,
      },
      stats:
        // TODO: pick props
        instance.databases.get(database)?.collections.get(collection, 'name') ??
        null,
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

  instance.on(
    'change:collections.status',
    (collectionModel: Collection, status: string) => {
      if (collectionModel.ns !== collectionMetadata.namespace) {
        return;
      }

      if (status === 'ready') {
        store.dispatch(collectionStatsFetched(collectionModel));
      }
    }
  );

  localAppRegistry.on('open-create-index-modal', () => {
    store.dispatch(selectTab('Indexes'));
  });

  localAppRegistry.on('generate-aggregation-from-query', () => {
    store.dispatch(selectTab('Aggregations'));
  });

  return store;
}
