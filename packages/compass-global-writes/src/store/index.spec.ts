import { expect } from 'chai';
import { type GlobalWritesStore } from '.';
import { setupStore } from '../../tests/create-store';
import {
  fetchClusterShardingData,
  createShardKey,
  type CreateShardKeyData,
} from './reducer';
import sinon from 'sinon';
import type { ClusterDetailsApiResponse } from '../services/atlas-global-writes-service';

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

function createClusterDetailsResponse(data: ClusterDetailsApiResponse) {
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

  context('actions', function () {
    context('fetchClusterShardingData', function () {
      it('when the namespace is not managed', async function () {
        const store = createStore({
          authenticatedFetch: () =>
            createClusterDetailsResponse(clusterDetails),
        });
        await store.dispatch(fetchClusterShardingData());
        expect(store.getState().status).to.equal('UNSHARDED');
        expect(store.getState().managedNamespace).to.equal(undefined);
      });

      // TODO (COMPASS-8277): Add more test for fetching shard key and process errors
    });

    context('createShardKey', function () {
      const shardKeyData: CreateShardKeyData = {
        customShardKey: 'test',
        isCustomShardKeyHashed: true,
        isShardKeyUnique: false,
        numInitialChunks: 1,
        presplitHashedZones: true,
      };

      it('sets SUBMITTING_FOR_SHARDING state when starting to create shard key and sets to SHARDING on success', async function () {
        const store = createStore({
          authenticatedFetch: () =>
            createClusterDetailsResponse(clusterDetails),
        });

        const promise = store.dispatch(createShardKey(shardKeyData));
        expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');

        await promise;
        expect(store.getState().status).to.equal('SHARDING');
      });

      it('sets SUBMITTING_FOR_SHARDING state when starting to create shard key and sets to UNSHARDED on failure', async function () {
        const store = createStore({
          authenticatedFetch: () => Promise.reject(new Error('error')),
        });

        const promise = store.dispatch(createShardKey(shardKeyData));
        expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');

        await promise;
        expect(store.getState().status).to.equal('UNSHARDED');
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

        const getClusterInfoApiResponse = createClusterDetailsResponse({
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
});
