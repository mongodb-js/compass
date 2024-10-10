import { expect } from 'chai';
import { type GlobalWritesStore } from '.';
import { setupStore } from '../../tests/create-store';
import {
  fetchClusterShardingData,
  createShardKey,
  type CreateShardKeyData,
  TEST_POLLING_INTERVAL,
} from './reducer';
import sinon from 'sinon';
import type {
  AutomationAgentDeploymentStatusApiResponse,
  AutomationAgentProcess,
  ClusterDetailsApiResponse,
  ManagedNamespace,
  ShardZoneMapping,
} from '../services/atlas-global-writes-service';
import { wait, waitFor } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';

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

const shardKeyData: CreateShardKeyData = {
  customShardKey: 'secondary',
  isCustomShardKeyHashed: true,
  isShardKeyUnique: true,
  numInitialChunks: 1,
  presplitHashedZones: true,
};

const managedNamespace: ManagedNamespace = {
  db: DB,
  collection: COLL,
  ...shardKeyData,
};

const failedShardingProcess: AutomationAgentProcess = {
  statusType: 'ERROR',
  workingOnShort: 'ShardingCollections',
  errorText: `Failed to shard ${NS}`,
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

function createStore({
  isNamespaceManaged = () => false,
  hasShardingError = () => false,
  hasShardKey = () => false,
  failsOnShardingRequest = () => false,
  authenticatedFetchStub,
}:
  | {
      isNamespaceManaged?: () => boolean;
      hasShardingError?: () => boolean;
      hasShardKey?: () => boolean;
      failsOnShardingRequest?: () => boolean;
      authenticatedFetchStub?: never;
    }
  | {
      isNamespaceManaged?: never;
      hasShardingError?: never;
      hasShardKey?: () => boolean;
      failsOnShardingRequest?: never;
      authenticatedFetchStub?: () => void;
    } = {}): GlobalWritesStore {
  const atlasService = {
    authenticatedFetch: (uri: string) => {
      if (uri.includes(`/geoSharding`) && failsOnShardingRequest()) {
        return Promise.reject(new Error('Failed to shard'));
      }

      if (uri.includes('/clusters/')) {
        return createAuthFetchResponse({
          ...clusterDetails,
          geoSharding: {
            ...clusterDetails.geoSharding,
            managedNamespaces: isNamespaceManaged() ? [managedNamespace] : [],
          },
        });
      }

      if (uri.includes('/deploymentStatus/')) {
        return createAuthFetchResponse({
          automationStatus: {
            processes: hasShardingError() ? [failedShardingProcess] : [],
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
          response: hasShardKey()
            ? [
                {
                  key: {
                    location: 'range',
                    secondary: shardKeyData.isCustomShardKeyHashed
                      ? 'hashed'
                      : 'range',
                  },
                  unique: true,
                },
              ]
            : [],
        };
      }
    },
  } as any;

  if (authenticatedFetchStub)
    atlasService.authenticatedFetch = authenticatedFetchStub;

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
    it('not managed -> sharding -> success', async function () {
      let mockShardKey = false;
      const hasShardKey = Sinon.fake(() => mockShardKey);
      // initial state === unsharded
      const store = createStore({
        hasShardKey,
      });
      await store.dispatch(fetchClusterShardingData());
      expect(store.getState().status).to.equal('UNSHARDED');
      expect(store.getState().managedNamespace).to.equal(undefined);

      // user requests sharding
      const promise = store.dispatch(createShardKey(shardKeyData));
      expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');
      await promise;
      expect(store.getState().status).to.equal('SHARDING');

      // sharding ends with a shardKey
      mockShardKey = true;
      await wait(TEST_POLLING_INTERVAL);
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
      });
    });

    it('not managed -> sharding -> sharding error', async function () {
      let mockFailure = false;
      const hasShardingError = Sinon.fake(() => mockFailure);
      // initial state === unsharded
      const store = createStore({
        hasShardingError,
      });
      await store.dispatch(fetchClusterShardingData());
      expect(store.getState().status).to.equal('UNSHARDED');
      expect(store.getState().managedNamespace).to.equal(undefined);

      // user requests sharding
      const promise = store.dispatch(createShardKey(shardKeyData));
      expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');
      await promise;
      expect(store.getState().status).to.equal('SHARDING');

      // sharding ends with an error
      mockFailure = true;
      await wait(TEST_POLLING_INTERVAL);
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARDING_ERROR');
      });
    });

    it('not managed -> failed sharding attempt', async function () {
      const store = createStore({
        failsOnShardingRequest: () => true,
      });
      await store.dispatch(fetchClusterShardingData());
      expect(store.getState().status).to.equal('UNSHARDED');
      expect(store.getState().managedNamespace).to.equal(undefined);

      const promise = store.dispatch(createShardKey(shardKeyData));
      expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');
      await promise;
      expect(store.getState().status).to.equal('UNSHARDED');
    });

    it('when the namespace is managed and has a valid shard key', async function () {
      const store = createStore({
        isNamespaceManaged: () => true,
        hasShardKey: () => true,
      });
      await store.dispatch(fetchClusterShardingData());
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });
    });

    it('when the namespace is managed but has a sharding error', async function () {
      const store = createStore({
        isNamespaceManaged: () => true,
        hasShardingError: () => true,
      });
      await store.dispatch(fetchClusterShardingData());
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARDING_ERROR');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });
    });

    it('sends correct data to the server when creating a shard key', async function () {
      const alreadyManagedNamespaces = [
        {
          db: 'test',
          collection: 'one',
          customShardKey: 'secondary',
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
        authenticatedFetchStub: fetchStub,
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
