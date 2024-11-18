import { expect } from 'chai';
import { type GlobalWritesStore } from '.';
import { setupStore } from '../../tests/create-store';
import {
  createShardKey,
  type CreateShardKeyData,
  unmanageNamespace,
  cancelSharding,
  resumeManagedNamespace,
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
  workingOnShort: 'ShardCollections',
  errorText: `before timestamp[01:02:03.456]Failed to shard ${NS}`,
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

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const expectPolling = async ({
  spy,
  clock,
  interval,
  reverse,
}: {
  spy: Sinon.SinonSpy;
  clock: Sinon.SinonFakeTimers;
  interval: number;
  reverse?: boolean;
}) => {
  spy.resetHistory();
  clock.tick(interval);
  // leaving time for the poll to actually execute after the clock tick
  await wait(1);
  if (!reverse) {
    expect(spy).to.have.been.called;
  } else {
    expect(spy).not.to.have.been.called;
  }
};

function createStore({
  isNamespaceManaged = () => false,
  hasShardingError = () => false,
  hasShardKey = () => false,
  failsOnShardingRequest = () => false,
  failsOnShardZoneRequest = () => false,
  failsToFetchClusterDetails = () => false,
  failsToFetchDeploymentStatus = () => false,
  failsToFetchShardKey = () => false,
  authenticatedFetchStub,
}:
  | {
      isNamespaceManaged?: () => boolean;
      hasShardingError?: () => boolean;
      hasShardKey?: () => boolean | AtlasShardKey;
      failsOnShardingRequest?: () => boolean;
      failsOnShardZoneRequest?: () => boolean;
      failsToFetchClusterDetails?: () => boolean;
      failsToFetchDeploymentStatus?: () => boolean;
      failsToFetchShardKey?: () => boolean;
      authenticatedFetchStub?: never;
    }
  | {
      isNamespaceManaged?: never;
      hasShardingError?: never;
      hasShardKey?: () => boolean | ShardKey;
      failsOnShardingRequest?: never;
      failsOnShardZoneRequest?: () => never;
      failsToFetchClusterDetails?: never;
      failsToFetchDeploymentStatus?: never;
      failsToFetchShardKey?: () => boolean;
      authenticatedFetchStub?: () => void;
    } = {}): GlobalWritesStore {
  const atlasService = {
    authenticatedFetch: (uri: string) => {
      if (uri.endsWith('/geoSharding') && failsOnShardingRequest()) {
        return Promise.reject(new Error('Failed to shard'));
      }

      if (uri.includes('/clusters/')) {
        if (failsToFetchClusterDetails()) {
          return Promise.reject(new Error('Failed to fetch cluster details'));
        }
        return createAuthFetchResponse({
          ...clusterDetails,
          geoSharding: {
            ...clusterDetails.geoSharding,
            managedNamespaces: isNamespaceManaged() ? [managedNamespace] : [],
          },
        });
      }

      if (uri.includes('/deploymentStatus/')) {
        if (failsToFetchDeploymentStatus()) {
          return Promise.reject(new Error('Failed to fetch deployment status'));
        }
        return createAuthFetchResponse({
          automationStatus: {
            processes: hasShardingError() ? [failedShardingProcess] : [],
          },
        });
      }

      if (
        /geoSharding.*newFormLocationMapping/.test(uri) &&
        failsOnShardZoneRequest()
      ) {
        return Promise.reject(new Error('Failed to fetch shard zones'));
      }

      return createAuthFetchResponse({});
    },
    automationAgentRequest: (_meta: unknown, type: string) => ({
      _id: '123',
      requestType: type,
    }),
    automationAgentAwait: (_meta: unknown, type: string) => {
      if (type === 'getShardKey') {
        if (failsToFetchShardKey()) {
          return Promise.reject(new Error('Failed to fetch shardKey'));
        }

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
    context('initial load fail', function () {
      it('fails to fetch cluster details', async function () {
        const store = createStore({
          failsToFetchClusterDetails: () => true,
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('LOADING_ERROR');
        });
      });

      it('fails to fetch shard key', async function () {
        const store = createStore({
          failsToFetchShardKey: () => true,
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('LOADING_ERROR');
        });
      });

      it('fails to fetch deployment status', async function () {
        const store = createStore({
          failsToFetchDeploymentStatus: () => true,
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('LOADING_ERROR');
        });
      });
    });

    it('not managed -> sharding -> shard key correct', async function () {
      let mockShardKey = false;
      let mockManagedNamespace = false;
      const hasShardKey = Sinon.fake(() => mockShardKey);
      // initial state === unsharded
      const store = createStore({
        hasShardKey,
        isNamespaceManaged: Sinon.fake(() => mockManagedNamespace),
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
      expect(store.getState().userActionInProgress).to.equal(
        'submitForSharding'
      );
      mockManagedNamespace = true;
      await promise;
      expect(store.getState().status).to.equal('SHARDING');

      // empty polling for a while
      await expectPolling({
        clock,
        interval: POLLING_INTERVAL,
        spy: hasShardKey,
      });
      await expectPolling({
        clock,
        interval: POLLING_INTERVAL,
        spy: hasShardKey,
      });

      // sharding ends with a shardKey
      mockShardKey = true;
      await expectPolling({
        clock,
        interval: POLLING_INTERVAL,
        spy: hasShardKey,
      });

      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
        expect(store.getState().userActionInProgress).to.be.undefined;
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
      expect(store.getState().userActionInProgress).to.equal(
        'submitForSharding'
      );
      await promise;
      expect(store.getState().status).to.equal('SHARDING');

      // sharding ends with an error
      mockFailure = true;
      clock.tick(POLLING_INTERVAL);
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARDING_ERROR');
        expect(store.getState().userActionInProgress).to.be.undefined;
        expect(store.getState().shardingError).to.equal(
          `Failed to shard ${NS}`
        ); // the original error text was: `before timestamp[01:02:03.456]Failed to shard ${NS}`
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
      expect(store.getState().userActionInProgress).to.equal(
        'submitForSharding'
      );
      await promise;
      expect(store.getState().status).to.equal('UNSHARDED');
      expect(store.getState().userActionInProgress).to.be.undefined;
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
        failsOnShardZoneRequest: () => true,
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

    context('pulling fail', function () {
      it('sharding -> error (failed to fetch shard key)', async function () {
        let mockFailure = false;
        // initial state === sharding
        clock = sinon.useFakeTimers({
          shouldAdvanceTime: true,
        });
        const store = createStore({
          isNamespaceManaged: () => true,
          failsToFetchShardKey: Sinon.fake(() => mockFailure),
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('SHARDING');
        });

        // sharding ends with a request failure
        mockFailure = true;
        clock.tick(POLLING_INTERVAL);
        await waitFor(() => {
          expect(store.getState().status).to.equal('LOADING_ERROR');
        });
      });

      it('sharding -> error (failed to fetch deployment status)', async function () {
        let mockFailure = false;
        // initial state === sharding
        clock = sinon.useFakeTimers({
          shouldAdvanceTime: true,
        });
        const store = createStore({
          isNamespaceManaged: () => true,
          failsToFetchDeploymentStatus: Sinon.fake(() => mockFailure),
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('SHARDING');
        });

        // sharding ends with a request failure
        mockFailure = true;
        clock.tick(POLLING_INTERVAL);
        await waitFor(() => {
          expect(store.getState().status).to.equal('LOADING_ERROR');
        });
      });
    });

    it('sharding -> cancelling request -> not managed', async function () {
      let mockManagedNamespace = true;
      const hasShardKey = Sinon.fake(() => false);
      confirmationStub.resolves(true);
      // initial state === sharding
      clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });
      const store = createStore({
        isNamespaceManaged: Sinon.fake(() => mockManagedNamespace),
        hasShardKey,
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARDING');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });

      await expectPolling({
        clock,
        interval: POLLING_INTERVAL,
        spy: hasShardKey,
      });

      // user cancels the sharding request
      const promise = store.dispatch(cancelSharding());
      mockManagedNamespace = false;
      await promise;
      expect(store.getState().status).to.equal('UNSHARDED');
      expect(confirmationStub).to.have.been.called;

      // is no longer polling
      await expectPolling({
        reverse: true,
        clock,
        interval: POLLING_INTERVAL,
        spy: hasShardKey,
      });
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

    it('valid shard key -> failsOnShardZoneRequest', async function () {
      const store = createStore({
        isNamespaceManaged: () => true,
        hasShardKey: () => true,
        failsOnShardZoneRequest: () => true,
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });
    });

    it('incomplete setup -> sharding -> shard key correct', async function () {
      // initial state -> incomplete shardingSetup
      clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });
      let mockManagedNamespace = false;
      const store = createStore({
        isNamespaceManaged: Sinon.fake(() => mockManagedNamespace),
        hasShardKey: () => true,
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('INCOMPLETE_SHARDING_SETUP');
        expect(store.getState().managedNamespace).to.be.undefined;
      });

      // user asks to resume geosharding
      const promise = store.dispatch(resumeManagedNamespace());
      mockManagedNamespace = true;
      expect(store.getState().userActionInProgress).to.equal(
        'submitForSharding'
      );
      await promise;

      // sharding
      expect(store.getState().status).to.equal('SHARDING');

      // done
      clock.tick(POLLING_INTERVAL);
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
        expect(store.getState().userActionInProgress).to.be.undefined;
      });
    });

    it('incomplete setup -> sharding -> incomplete setup (request was cancelled)', async function () {
      // initial state -> incomplete shardingSetup
      clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });
      const store = createStore({
        isNamespaceManaged: () => false,
        hasShardKey: () => true,
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('INCOMPLETE_SHARDING_SETUP');
        expect(store.getState().managedNamespace).to.be.undefined;
      });

      // user asks to resume geosharding
      const promise = store.dispatch(resumeManagedNamespace());
      expect(store.getState().userActionInProgress).to.equal(
        'submitForSharding'
      );
      await promise;

      // sharding
      expect(store.getState().status).to.equal('SHARDING');

      // user cancels the request - we go back to incomplete
      const promise2 = store.dispatch(cancelSharding());
      await promise2;
      clock.tick(POLLING_INTERVAL);
      await waitFor(() => {
        expect(store.getState().status).to.equal('INCOMPLETE_SHARDING_SETUP');
        expect(store.getState().userActionInProgress).to.be.undefined;
        expect(store.getState().userActionInProgress).to.be.undefined;
      });
    });

    it('incomplete setup -> incomplete setup (failed manage attempt)', async function () {
      // initial state -> incomplete shardingSetup
      clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });
      const store = createStore({
        isNamespaceManaged: () => false,
        hasShardKey: () => true,
        failsOnShardingRequest: () => true,
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('INCOMPLETE_SHARDING_SETUP');
        expect(store.getState().managedNamespace).to.be.undefined;
      });

      // user asks to resume geosharding
      const promise = store.dispatch(resumeManagedNamespace());
      expect(store.getState().userActionInProgress).to.equal(
        'submitForSharding'
      );
      await promise;

      // it failed
      await waitFor(() => {
        expect(store.getState().status).to.equal('INCOMPLETE_SHARDING_SETUP');
        expect(store.getState().userActionInProgress).to.be.undefined;
      });
    });

    it('valid shard key -> incomplete', async function () {
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
      expect(store.getState().userActionInProgress).to.equal(
        'unmanageNamespace'
      );
      await promise;
      expect(store.getState().status).to.equal('INCOMPLETE_SHARDING_SETUP');
      expect(store.getState().userActionInProgress).to.be.undefined;
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
      expect(store.getState().userActionInProgress).to.equal(
        'unmanageNamespace'
      );
      await promise;
      expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
      expect(store.getState().userActionInProgress).to.be.undefined;
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
          hasShardingError: () => true, // mismatch will also trigger an error
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
          hasShardingError: () => true, // mismatch will also trigger an error
        });
        await waitFor(() => {
          expect(store.getState().status).to.equal('SHARD_KEY_MISMATCH');
        });
      });

      it('mismatch -> incomplete sharding setup', async function () {
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
        expect(store.getState().userActionInProgress).to.equal(
          'unmanageNamespace'
        );
        await promise;
        expect(store.getState().status).to.equal('INCOMPLETE_SHARDING_SETUP');
        expect(store.getState().userActionInProgress).to.be.undefined;
      });
    });

    it('sharding error -> cancelling request -> not managed', async function () {
      // initial state === sharding error
      let mockManagedNamespace = true;
      let mockShardingError = true;
      clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });
      const store = createStore({
        isNamespaceManaged: Sinon.fake(() => mockManagedNamespace),
        hasShardingError: Sinon.fake(() => mockShardingError),
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARDING_ERROR');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });

      // user triggers a cancellation
      const promise = store.dispatch(cancelSharding());
      mockManagedNamespace = false;
      mockShardingError = false;
      await promise;
      expect(store.getState().status).to.equal('UNSHARDED');
      expect(confirmationStub).to.have.been.called;
    });

    it('sharding error -> submitting form -> sharding -> sharded', async function () {
      // initial state === sharding error=
      let mockShardingError = true;
      let mockShardKey = false;
      clock = sinon.useFakeTimers({
        shouldAdvanceTime: true,
      });
      const store = createStore({
        isNamespaceManaged: () => true,
        hasShardingError: Sinon.fake(() => mockShardingError),
        hasShardKey: Sinon.fake(() => mockShardKey),
      });
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARDING_ERROR');
        expect(store.getState().managedNamespace).to.equal(managedNamespace);
      });

      // user submits the form
      const promise = store.dispatch(createShardKey(shardKeyData));
      mockShardingError = false;
      expect(store.getState().userActionInProgress).to.equal(
        'submitForSharding'
      );
      await promise;
      expect(store.getState().status).to.equal('SHARDING');

      // the key is created
      mockShardKey = true;
      clock.tick(POLLING_INTERVAL);
      await waitFor(() => {
        expect(store.getState().status).to.equal('SHARD_KEY_CORRECT');
        expect(store.getState().userActionInProgress).to.be.undefined;
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
