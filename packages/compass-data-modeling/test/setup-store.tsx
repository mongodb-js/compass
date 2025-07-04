import React from 'react';
import type { RenderWithConnectionsResult } from '@mongodb-js/testing-library-compass';
import { renderWithConnections } from '@mongodb-js/testing-library-compass';
import { createActivateHelpers } from '@mongodb-js/compass-app-registry';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { TestMongoDBInstanceManager } from '@mongodb-js/compass-app-stores/provider';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { activateDataModelingStore } from '../src/store';
import type { DataModelingStoreServices } from '../src/store';
import { noopDataModelStorageService } from '../src/provider';
import { Provider } from 'react-redux';

type ConnectionInfoWithMockData = ConnectionInfo & {
  databases: Array<{
    _id: string;
    name: string;
    collectionsStatus: string;
    collectionsLength: number;
    collections: Array<{
      _id: string;
      name: string;
      type: string;
      sourceName: string;
    }>;
  }>;
};

export type DataModelingStore = Awaited<ReturnType<typeof setupStore>>;
const testConnections = [
  {
    id: 'one',
    savedConnectionType: 'favorite' as const,
    favorite: {
      name: 'Conn1',
    },
    connectionOptions: {
      connectionString: 'mongodb://localhost:27020/test',
    },
    databases: [
      {
        _id: 'db_initial',
        name: 'db_initial',
        collectionsStatus: 'initial',
        collectionsLength: 0,
        collections: [],
      },
      {
        _id: 'db_ready',
        name: 'db_ready',
        collectionsStatus: 'ready',
        collectionsLength: 3,
        collections: [
          {
            _id: 'db_ready.meow',
            name: 'meow',
            type: 'collection',
            sourceName: '',
            pipeline: [],
          },
          {
            _id: 'db_ready.woof',
            name: 'woof',
            type: 'timeseries',
            sourceName: '',
            pipeline: [],
          },
          {
            _id: 'db_ready.bwok',
            name: 'bwok',
            type: 'view',
            sourceName: '',
            pipeline: [],
          },
        ],
      },
    ],
  },
  {
    id: 'two',
    savedConnectionType: 'recent' as const,
    favorite: {
      name: 'Conn2',
    },
    connectionOptions: {
      connectionString: 'mongodb://localhost:27021/test',
    },
    databases: [
      {
        _id: 'berlin',
        name: 'berlin',
        collectionsStatus: 'initial',
        collectionsLength: 1,
        collections: [
          {
            _id: 'berlin.parks',
            name: 'parks',
            type: 'collection',
            sourceName: '',
            pipeline: [],
          },
        ],
      },
      {
        _id: 'sample_airbnb',
        name: 'sample_airbnb',
        collectionsStatus: 'ready',
        collectionsLength: 3,
        collections: [
          {
            _id: 'sample_airbnb.listings',
            name: 'listings',
            type: 'collection',
            sourceName: '',
            pipeline: [],
          },
          {
            _id: 'sample_airbnb.reviews',
            name: 'reviews',
            type: 'collection',
            sourceName: '',
            pipeline: [],
          },
          {
            _id: 'sample_airbnb.listingsAndReviews',
            name: 'listingsAndReviews',
            type: 'view',
            sourceName: 'listings',
            pipeline: [],
          },
        ],
      },
    ],
  },
];

export const setupStore = (
  services: Partial<DataModelingStoreServices> = {},
  connections: ConnectionInfoWithMockData[] = testConnections
) => {
  return activateDataModelingStore(
    {},
    {
      logger: createNoopLogger('TEST'),
      track: createNoopTrack(),
      connections: {
        connect() {
          return Promise.resolve();
        },
        getConnectionById(connId: string) {
          const conn = connections.find((x) => x.id === connId);
          if (!conn) {
            return undefined;
          }
          return {
            info: connections.find((x) => x.id === connId),
          };
        },
        getDataServiceForConnection(connId: string) {
          const conn = connections.find((x) => x.id === connId);
          if (!conn) {
            throw new Error('No available connection');
          }
          return {
            listDatabases: () => {
              return Promise.resolve(conn.databases);
            },
            listCollections: (database: string) => {
              return Promise.resolve(
                conn.databases.find((x) => x._id === database)?.collections
              );
            },
          };
        },
      } as any,
      preferences: {} as any,
      instanceManager: new TestMongoDBInstanceManager(),
      dataModelStorage: noopDataModelStorageService,
      ...services,
    },
    createActivateHelpers()
  ).store;
};

export const renderWithStore = (
  component: JSX.Element,
  {
    services = {},
    connections = testConnections,
  }: {
    services?: Partial<DataModelingStoreServices>;
    connections?: ConnectionInfoWithMockData[];
  } = {}
): RenderWithConnectionsResult & { store: DataModelingStore } => {
  // TODO: use createPluginTestHelpers instead of most of the code in this file
  const store = setupStore(services, connections);
  const renderResult = renderWithConnections(
    <Provider store={store}>{component}</Provider>,
    { connections }
  );
  return { ...renderResult, store };
};
