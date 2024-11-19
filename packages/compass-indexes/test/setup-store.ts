import { EventEmitter } from 'events';
import Sinon from 'sinon';
import type AppRegistry from 'hadron-app-registry';
import type {
  IndexesDataService,
  IndexesPluginOptions,
  IndexesPluginServices,
  IndexesStore,
} from '../src/stores/store';
import { activateIndexesPlugin } from '../src/stores/store';
import { createActivateHelpers } from 'hadron-app-registry';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import { waitFor } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';

const NOOP_DATA_PROVIDER: IndexesDataService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  indexes(ns: string, options: any) {
    return Promise.resolve([]);
  },
  isConnected() {
    return true;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateCollection(ns: string, flags: any) {
    return Promise.resolve({});
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createIndex(ns, spec, options) {
    return Promise.resolve('ok');
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dropIndex(ns, name) {
    return Promise.resolve({});
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSearchIndexes(ns: string) {
    return Promise.resolve([]);
  },
  createSearchIndex(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ns: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    description: {
      name: string;
      definition: any;
      type: string;
    }
  ) {
    return Promise.resolve('new-id');
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateSearchIndex(ns: string, name: string, spec: any) {
    return Promise.resolve();
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dropSearchIndex(ns: string, name: string) {
    return Promise.resolve();
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  collectionInfo(dbName, collName) {
    return Promise.resolve(null);
  },
  collectionStats(databaseName, collectionName) {
    return Promise.resolve({
      avg_document_size: 0,
      count: 0,
      database: databaseName,
      document_count: 0,
      free_storage_size: 0,
      index_count: 0,
      index_size: 0,
      name: collectionName,
      ns: `${databaseName}.${collectionName}`,
      storage_size: 0,
    });
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isListSearchIndexesSupported(ns) {
    return Promise.resolve(false);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  listCollections(databaseName, filter, options) {
    return Promise.resolve([]);
  },
};

class FakeInstance extends EventEmitter {
  isWritable = true;
  description = 'initial description';
}

const fakeInstance = new FakeInstance();

const defaultMetadata = {
  namespace: 'test.foo',
  isReadonly: false,
  isTimeSeries: false,
  isClustered: false,
  isFLE: false,
  isSearchIndexesSupported: false,
  sourceName: 'test.bar',
};

export function createMockCollection() {
  return {
    _id: defaultMetadata.namespace,
    fetch: Sinon.spy(),
    fetchMetadata() {
      return Promise.resolve(defaultMetadata);
    },
    toJSON() {
      return this;
    },
    on: Sinon.spy(),
  } as any;
}

export const setupStore = (
  options: Partial<IndexesPluginOptions> = {},
  dataProvider: Partial<IndexesDataService> = NOOP_DATA_PROVIDER,
  services: Partial<IndexesPluginServices> = {}
) => {
  const localAppRegistry = {
    on: Sinon.spy(),
    emit: Sinon.spy(),
  } as unknown as AppRegistry;
  const globalAppRegistry = {
    on: Sinon.spy(),
    emit: Sinon.spy(),
    getStore: Sinon.spy(),
  } as unknown as AppRegistry;

  const connectionInfoRef = {
    current: {
      id: 'TEST',
    },
  } as ConnectionInfoRef;

  const atlasService = {} as AtlasService;

  return activateIndexesPlugin(
    {
      namespace: 'citibike.trips',
      serverVersion: '6.0.0',
      isReadonly: false,
      isSearchIndexesSupported: true,
      ...options,
    },
    {
      dataService: { ...NOOP_DATA_PROVIDER, ...dataProvider },
      globalAppRegistry,
      localAppRegistry,
      instance: fakeInstance as any,
      logger: createNoopLogger('TEST'),
      track: createNoopTrack(),
      collection: createMockCollection(),
      connectionInfoRef,
      atlasService,
      preferences: {
        getPreferences() {
          return {
            enableRollingIndexes: true,
          };
        },
      } as any,
      ...services,
    },
    createActivateHelpers()
  ).store;
};

export async function setupStoreAndWait(
  options?: Partial<IndexesPluginOptions>,
  dataProvider?: Partial<IndexesDataService>,
  services?: Partial<IndexesPluginServices>
): Promise<IndexesStore> {
  const store = setupStore(options, dataProvider, services);
  await waitFor(() => {
    expect(store.getState().regularIndexes.status).to.be.oneOf([
      'READY',
      'ERROR',
    ]);
    if (store.getState().isSearchIndexesSupported) {
      expect(store.getState().searchIndexes.status).to.be.oneOf([
        'READY',
        'ERROR',
      ]);
    }
  });
  return store;
}
