import { expect } from 'chai';
import { type GlobalWritesStore } from '.';
import { setupStore } from '../../tests/create-store';
import {
  fetchClusterShardingData,
  createShardKey,
  type CreateShardKeyData,
} from './reducer';
import sinon from 'sinon';
import type {
  AutomationAgentDeploymentStatusApiResponse,
  ClusterDetailsApiResponse,
  ManagedNamespace,
  ShardZoneMapping,
} from '../services/atlas-global-writes-service';
import { waitFor } from '@mongodb-js/testing-library-compass';

const DB = 'test';
const COLL = 'coll';
const NS = `${DB}.${COLL}`;

const clusterDetails: ClusterDetailsApiResponse = {
  geoSharding: {
    customZoneMapping: {},
    managedNamespaces: [],
    selfManagedSharding: false,
  },
  replicationSpecList: [],
};

const managedNamespace: ManagedNamespace = {
  db: DB,
  collection: COLL,
  customShardKey: 'secondary',
  isCustomShardKeyHashed: false,
  isShardKeyUnique: false,
  numInitialChunks: null,
  presplitHashedZones: false,
};

const shardKeyData: CreateShardKeyData = {
  customShardKey: 'test',
  isCustomShardKeyHashed: true,
  isShardKeyUnique: false,
  numInitialChunks: 1,
  presplitHashedZones: true,
};

function createAuthFetchResponse<
  TResponse extends
    | ClusterDetailsApiResponse
    | AutomationAgentDeploymentStatusApiResponse
    | Record<string, ShardZoneMapping>
>(data: TResponse) {
  return {
    json: () => Promise.resolve(data),
  };
}

function createStore(atlasService: any = {}): GlobalWritesStore {
  return setupStore(
    {
      namespace: NS,
    },
    {
      atlasService,
    }
  );
}

describe('GlobalWritesStore Store', function () {
  it('sets the initial state', function () {
    const store = createStore();
    expect(store.getState().namespace).to.equal(NS);
    expect(store.getState().status).to.equal('NOT_READY');
  });

  context('scenarios', function () {
    it('not managed -> sharding', async function () {
      const store = createStore({
        authenticatedFetch: () => createAuthFetchResponse(clusterDetails),
      });
      await store.dispatch(fetchClusterShardingData());
      expect(store.getState().status).to.equal('UNSHARDED');
      expect(store.getState().managedNamespace).to.equal(undefined);

      const promise = store.dispatch(createShardKey(shardKeyData));
      expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');
      await promise;
      expect(store.getState().status).to.equal('SHARDING');
    });

    it('not managed -> failed sharding attempt', async function () {
      const store = createStore({
        authenticatedFetch: (uri: string) => {
          if (uri.includes('/geoSharding')) {
            return Promise.reject(new Error('Failed to shard'));
          }

          return createAuthFetchResponse(clusterDetails);
        },
      });
      await store.dispatch(fetchClusterShardingData());
      expect(store.getState().status).to.equal('UNSHARDED');
      expect(store.getState().managedNamespace).to.equal(undefined);

      const promise = store.dispatch(createShardKey(shardKeyData));
      expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');
      await promise;
      expect(store.getState().status).to.equal('UNSHARDED');
    });

    it('when the namespace is managed', async function () {
      const store = createStore({
        authenticatedFetch: (uri: string) => {
          if (uri.includes('/clusters/')) {
            return createAuthFetchResponse({
              ...clusterDetails,
              geoSharding: {
                ...clusterDetails.geoSharding,
                managedNamespaces: [managedNamespace],
              },
            });
          }

          if (uri.includes('/deploymentStatus/')) {
            return createAuthFetchResponse({
              automationStatus: {
                processes: [],
              },
            });
          }

          return createAuthFetchResponse({});
        },
        automationAgentRequest: (_meta: unknown, type: string) => ({
          _id: '123',
          requestType: type,
        }),
        automationAgentAwait: (_meta: unknown, type: string) => {
          if (type === 'getShardKey') {
            return {
              response: [
                {
                  key: {
                    location: 'HASHED',
                    secondary: 'HASHED',
                  },
                  unique: false,
                },
              ],
            };
          }
        },
      });
      await store.dispatch(fetchClusterShardingData());
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });
    });

    it('sends correct data to the server when creating a shard key', async function () {
      const alreadyManagedNamespaces = [
        {
          db: 'test',
          collection: 'one',
          customShardKey: 'test',
          isCustomShardKeyHashed: true,
          isShardKeyUnique: false,
          numInitialChunks: 1,
          presplitHashedZones: true,
        },
      ];

      const getClusterInfoApiResponse = createAuthFetchResponse({
        ...clusterDetails,
        geoSharding: {
          ...clusterDetails.geoSharding,
          managedNamespaces: alreadyManagedNamespaces,
        },
      });

      // We call cluster API when store is activated to get the initial state.
      // When creating a shard key, we call the same API to fetch the latest list of
      // managed namespaces & then send it to the server along with the shard key data.
      // So, we mock first and second call with same data. And then third call
      // should be to create the shard key.
      const fetchStub = sinon
        .stub()
        .onFirstCall()
        .returns(getClusterInfoApiResponse)
        .onSecondCall()
        .returns(getClusterInfoApiResponse)
        .onThirdCall()
        .resolves();

      const store = createStore({
        authenticatedFetch: fetchStub,
      });

      await store.dispatch(createShardKey(shardKeyData));

      const options = fetchStub.getCall(2).args[1];
      expect(options.method).to.equal('PATCH');
      expect(JSON.parse(options.body)).to.deep.equal({
        customZoneMapping: {},
        managedNamespaces: [
          ...alreadyManagedNamespaces,
          { ...shardKeyData, db: DB, collection: COLL },
        ],
        selfManagedSharding: false,
      });
    });
  });
});
