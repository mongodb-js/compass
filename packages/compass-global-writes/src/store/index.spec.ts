import { expect } from 'chai';
import { type GlobalWritesStore } from '.';
import { setupStore } from '../../tests/create-store';
import {
  createShardKey,
  type CreateShardKeyData,
  unmanageNamespace,
  cancelSharding,
  POLLING_INTERVAL,
  type ShardKey,
} from './reducer';
import sinon from 'sinon';
import type {
  AtlasShardKey,
  AutomationAgentDeploymentStatusApiResponse,
  AutomationAgentProcess,
  ClusterDetailsApiResponse,
  ManagedNamespace,
  ShardZoneMapping,
} from '../services/atlas-global-writes-service';
import { waitFor } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import * as globalWritesReducer from './reducer';

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
      hasShardKey?: () => boolean | AtlasShardKey;
      failsOnShardingRequest?: () => boolean;
      authenticatedFetchStub?: never;
    }
  | {
      isNamespaceManaged?: never;
      hasShardingError?: never;
      hasShardKey?: () => boolean | ShardKey;
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
        const shardKey = hasShardKey();
        return {
          response:
            shardKey === true
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
              : typeof shardKey === 'object'
              ? [shardKey]
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
  let confirmationStub: Sinon.SinonStub;
  let clock: Sinon.SinonFakeTimers;

  beforeEach(() => {
    confirmationStub = sinon
      .stub(globalWritesReducer, 'showConfirmation')
      .resolves(true);
  });

  afterEach(() => {
    sinon.restore();
    clock && clock.restore();
  });

  it('sets the initial state', function () {
    const store = createStore();
    expect(store.getState().namespace).to.equal(NS);
    expect(store.getState().status).to.equal('NOT_READY');
  });

  context('scenarios', function () {
    it('not managed -> sharding -> valid shard key', async function () {
      let mockShardKey = false;
      // initial state === unsharded
      const store = createStore({
        hasShardKey: Sinon.fake(() => mockShardKey),
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('UNSHARDED');
        expect(store.getState().managedNamespace).to.equal(undefined);
      });

      // user requests sharding
      clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });
      const promise = store.dispatch(createShardKey(shardKeyData));
      expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');
      await promise;
      expect(store.getState().status).to.equal('SHARDING');

      // sharding ends with a shardKey
      mockShardKey = true;
      clock.tick(POLLING_INTERVAL);
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
      });
    });

    it('not managed -> sharding -> sharding error', async function () {
      let mockFailure = false;
      // initial state === unsharded
      const store = createStore({
        hasShardingError: Sinon.fake(() => mockFailure),
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('UNSHARDED');
        expect(store.getState().managedNamespace).to.equal(undefined);
      });

      // user requests sharding
      clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });
      const promise = store.dispatch(createShardKey(shardKeyData));
      expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');
      await promise;
      expect(store.getState().status).to.equal('SHARDING');

      // sharding ends with an error
      mockFailure = true;
      clock.tick(POLLING_INTERVAL);
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARDING_ERROR');
      });
    });

    it('not managed -> not managed (failed sharding request)', async function () {
      // initial state === not managed
      const store = createStore({
        failsOnShardingRequest: () => true,
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('UNSHARDED');
        expect(store.getState().managedNamespace).to.equal(undefined);
      });

      // user tries to submit for sharding, but the request fails
      const promise = store.dispatch(createShardKey(shardKeyData));
      expect(store.getState().status).to.equal('SUBMITTING_FOR_SHARDING');
      await promise;
      expect(store.getState().status).to.equal('UNSHARDED');
    });

    it('sharding -> valid shard key', async function () {
      let mockShardKey = false;
      // initial state === sharding
      clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });
      const store = createStore({
        isNamespaceManaged: () => true,
        hasShardKey: Sinon.fake(() => mockShardKey),
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARDING');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });

      // sharding ends with a shardKey
      mockShardKey = true;
      clock.tick(POLLING_INTERVAL);
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
      });
    });

    it('sharding -> cancelling request -> not managed', async function () {
      let mockManagedNamespace = true;
      confirmationStub.resolves(true);
      // initial state === sharding
      const store = createStore({
        isNamespaceManaged: Sinon.fake(() => mockManagedNamespace),
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARDING');
        expect(store.getState().pollingTimeout).not.to.be.undefined;
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });

      // user cancels the sharding request
      const promise = store.dispatch(cancelSharding());
      mockManagedNamespace = false;
      await promise;
      expect(store.getState().status).to.equal('UNSHARDED');
      expect(store.getState().pollingTimeout).to.be.undefined;
      expect(confirmationStub).to.have.been.called;
    });

    it('valid shard key', async function () {
      const store = createStore({
        isNamespaceManaged: () => true,
        hasShardKey: () => true,
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });
    });

    it('valid shard key -> not managed', async function () {
      // initial state === shard key correct
      const store = createStore({
        isNamespaceManaged: () => true,
        hasShardKey: () => true,
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });

      // user asks to unmanage
      const promise = store.dispatch(unmanageNamespace());
      expect(store.getState().status).to.equal('UNMANAGING_NAMESPACE');
      await promise;
      expect(store.getState().status).to.equal('UNSHARDED');
    });

    it('valid shard key -> valid shard key (failed unmanage attempt)', async function () {
      // initial state === shard key correct
      let mockFailure = false;
      const store = createStore({
        isNamespaceManaged: () => true,
        hasShardKey: () => true,
        failsOnShardingRequest: Sinon.fake(() => mockFailure),
      });

      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });

      // user asks to unmanage
      mockFailure = true;
      const promise = store.dispatch(unmanageNamespace());
      expect(store.getState().status).to.equal('UNMANAGING_NAMESPACE');
      await promise;
      expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
    });

    context('invalid and mismatching shard keys', function () {
      it('there is no location : invalid', async function () {
        const store = createStore({
          isNamespaceManaged: () => true,
          hasShardKey: () => ({
            _id: '123',
            key: {
              notLocation: 'range', // invalid
              secondary: 'range',
            },
            unique: true,
          }),
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('SHARD_KEY_INVALID');
        });
      });

      it('location is not a range : invalid', async function () {
        const store = createStore({
          isNamespaceManaged: () => true,
          hasShardKey: () => ({
            _id: '123',
            key: {
              location: 'hashed', // invalid
              secondary: 'range',
            },
            unique: true,
          }),
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('SHARD_KEY_INVALID');
        });
      });

      it('secondary key does not match : mismatch', async function () {
        const store = createStore({
          isNamespaceManaged: () => true,
          hasShardKey: () => ({
            _id: '123',
            key: {
              location: 'range',
              tertiary: 'range', // this is a different secondary key
            },
            unique: true,
          }),
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('SHARD_KEY_MISMATCH');
        });
      });

      it('uniqueness does not match : mismatch', async function () {
        const store = createStore({
          isNamespaceManaged: () => true,
          hasShardKey: () => ({
            _id: '123',
            key: {
              location: 'range',
              secondary: 'range',
            },
            unique: false, // this does not match
          }),
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('SHARD_KEY_MISMATCH');
        });
      });

      it('mismatch -> unmanaged', async function () {
        // initial state - mismatch
        const store = createStore({
          isNamespaceManaged: () => true,
          hasShardKey: () => ({
            _id: '123',
            key: {
              location: 'range',
              tertiary: 'range',
            },
            unique: true,
          }),
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('SHARD_KEY_MISMATCH');
        });

        // user asks to unmanage
        const promise = store.dispatch(unmanageNamespace());
        expect(store.getState().status).to.equal(
          'UNMANAGING_NAMESPACE_MISMATCH'
        );
        await promise;
        expect(store.getState().status).to.equal('UNSHARDED');
      });
    });

    it('sharding error', async function () {
      const store = createStore({
        isNamespaceManaged: () => true,
        hasShardingError: () => true,
      });
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
