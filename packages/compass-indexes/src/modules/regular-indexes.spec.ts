import { expect } from 'chai';
import sinon from 'sinon';
import {
  refreshRegularIndexes,
  pollRegularIndexes,
  dropIndex,
  dropFailedIndex,
  hideIndex,
  unhideIndex,
  startPollingRegularIndexes,
  stopPollingRegularIndexes,
} from './regular-indexes';
import {
  indexesList,
  defaultSortedIndexes,
  inProgressIndexes,
} from '../../test/fixtures/regular-indexes';
import { readonlyViewChanged } from './is-readonly-view';
import {
  setupStore,
  setupStoreAndWait,
  createMockCollection,
} from '../../test/setup-store';

// Importing this to stub showConfirmation
import * as regularIndexesSlice from './regular-indexes';
import type { FetchStatus } from '../utils/fetch-status';
import { waitFor } from '@mongodb-js/testing-library-compass';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';

describe('regular-indexes module', function () {
  before(() => {
    sinon.stub(regularIndexesSlice, 'showConfirmation').resolves(true);
  });

  after(() => {
    sinon.restore();
  });

  describe('#fetchRegularIndexes action', function () {
    it('sets status to ERROR and sets the error when there is an error', async function () {
      const error = new Error('failed to connect to server');
      const store = await setupStoreAndWait(
        {},
        {
          indexes: () => Promise.reject(error),
        }
      );

      // Set some data to validate the empty array condition
      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          indexes: defaultSortedIndexes.slice(),
        },
      });

      const state = store.getState().regularIndexes;
      expect(state.error).to.equal(error.message);
      expect(state.status).to.equal('ERROR');
      expect(state.indexes).to.deep.equal(defaultSortedIndexes);
    });

    it('fetches rolling indexes when supported', async function () {
      const connectionInfoRef = {
        current: {
          atlasMetadata: {
            metricsType: 'cluster',
            instanceSize: 'M10',
          },
        },
      } as ConnectionInfoRef;

      const atlasServiceStub = {
        automationAgentRequest: sinon.stub(),
        automationAgentAwait: sinon.stub(),
      };

      atlasServiceStub.automationAgentRequest.resolves({
        _id: '_id',
        requestType: 'requestType',
      });
      atlasServiceStub.automationAgentAwait.resolves({
        response: [
          { indexName: 'abc', status: 'rolling build' },
          { indexName: 'cba', status: 'exists' },
        ],
      });

      const indexesStub = sinon.stub().resolves(defaultSortedIndexes);

      const store = await setupStoreAndWait(
        {},
        {
          indexes: indexesStub,
        },
        {
          connectionInfoRef,
          atlasService: atlasServiceStub as unknown as AtlasService,
        }
      );

      // it fetches immediately
      await waitFor(() => {
        expect(store.getState().regularIndexes.status).to.eq('READY');
      });

      expect(indexesStub.callCount).to.equal(1);
      expect(atlasServiceStub.automationAgentRequest.callCount).to.equal(1);
      expect(atlasServiceStub.automationAgentAwait.callCount).to.equal(1);

      expect(store.getState().regularIndexes.indexes).to.have.lengthOf(
        defaultSortedIndexes.length
      );
      expect(store.getState().regularIndexes.rollingIndexes).to.have.lengthOf(
        1
      );
    });
  });

  describe('#refreshRegularIndexes action', function () {
    it('sets indexes to empty array for views', async function () {
      const indexesStub = sinon.stub().resolves([]);
      const store = setupStore(
        {
          isReadonly: true,
        },
        {
          indexes: indexesStub,
        }
      );

      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          indexes: defaultSortedIndexes.map((index) => ({ ...index })),
        },
      });

      store.dispatch(readonlyViewChanged(true));

      await store.dispatch(refreshRegularIndexes());

      expect(store.getState().regularIndexes.indexes).to.have.lengthOf(0);
      expect(indexesStub.callCount).to.equal(0);
    });

    it('sets status to ready and sets the error when there is an error', async function () {
      const error = new Error('failed to connect to server');
      const store = await setupStoreAndWait(
        {},
        {
          indexes: () => Promise.reject(error),
        }
      );

      // Set some data to validate the empty array condition
      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          indexes: defaultSortedIndexes.slice(),
        },
      });

      await store.dispatch(refreshRegularIndexes());

      const state = store.getState().regularIndexes;
      expect(state.error).to.equal(error.message);
      expect(state.status).to.equal('READY');
      expect(state.indexes).to.deep.equal(defaultSortedIndexes);
    });

    it('sets indexes when fetched successfully', async function () {
      const store = await setupStoreAndWait(
        {},
        {
          indexes: () => Promise.resolve(defaultSortedIndexes),
        }
      );
      await store.dispatch(refreshRegularIndexes());

      const state = store.getState().regularIndexes;
      expect(state.indexes).to.deep.eq(defaultSortedIndexes);
      expect(state.error).to.be.undefined;
      expect(state.status).to.equal('READY');
    });

    it('sets status=FETCHING when indexes are being fetched and status is NOT_READY', async function () {
      let statusBeforeFetch: FetchStatus | undefined = undefined;

      const indexesStub = sinon.stub().callsFake(async () => {
        // make sure the store is done setting up before we try and use it
        await Promise.resolve();

        statusBeforeFetch = store.getState().regularIndexes.status;
        return Promise.resolve(defaultSortedIndexes);
      });

      const store = setupStore(
        {},
        {
          indexes: indexesStub,
        }
      );

      await waitFor(() => {
        expect(statusBeforeFetch).to.equal('FETCHING');
      });
    });

    it('sets status=REFRESHING when indexes are being fetched and status is READY', async function () {
      let calls = 0;
      let statusBeforeFetch: FetchStatus | undefined = undefined;

      const indexesStub = sinon.stub().callsFake(async () => {
        // make sure the store is done setting up before we try and use it
        await Promise.resolve();

        if (calls === 1) {
          statusBeforeFetch = store.getState().regularIndexes.status;
        }
        calls++;
        return Promise.resolve(defaultSortedIndexes);
      });

      const store = await setupStoreAndWait(
        {},
        {
          indexes: indexesStub,
        }
      );

      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          error: 'the previous error',
          status: 'READY',
          indexes: defaultSortedIndexes.slice(),
        },
      });

      expect(indexesStub.callCount).to.equal(1);
      await store.dispatch(refreshRegularIndexes());

      await waitFor(() => {
        expect(statusBeforeFetch).to.equal('REFRESHING');
      });

      expect(indexesStub.callCount).to.equal(2);
    });

    it('calls collection.fetch() when the indexes change', async function () {
      const changedSortedIndexes = [defaultSortedIndexes[0]];
      const indexesStub = sinon
        .stub()
        .onFirstCall()
        .resolves(defaultSortedIndexes)
        .onSecondCall()
        .resolves(changedSortedIndexes);

      const collection = createMockCollection();

      const store = await setupStoreAndWait(
        {},
        {
          indexes: indexesStub,
        },
        { collection }
      );

      // the initial fetch
      expect(indexesStub.callCount).to.equal(1);

      expect(collection.fetch.callCount).to.equal(0);

      await store.dispatch(refreshRegularIndexes());

      expect(indexesStub.callCount).to.equal(2);

      expect(collection.fetch.callCount).to.equal(1);
    });
  });

  describe('#pollRegularIndexes action', function () {
    it('sets status to READY and leaves error when there is an error', async function () {
      const error = new Error('failed to connect to server');
      const store = await setupStoreAndWait(
        {},
        {
          indexes: () => Promise.reject(error),
        }
      );

      // Set some data to validate the empty array condition
      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          error: 'the previous error',
          status: 'READY',
          indexes: defaultSortedIndexes.slice(),
        },
      });

      await store.dispatch(pollRegularIndexes());

      const state = store.getState().regularIndexes;
      expect(state.error).to.equal('the previous error');
      expect(state.status).to.equal('READY');
      expect(state.indexes).to.deep.equal(defaultSortedIndexes);
    });

    it('sets status=POLLING when indexes are being fetched', async function () {
      let statusBeforeFetch: FetchStatus | undefined = undefined;
      const store = await setupStoreAndWait(
        {},
        {
          indexes: sinon.stub().callsFake(() => {
            statusBeforeFetch = store.getState().regularIndexes.status;
            return Promise.resolve(defaultSortedIndexes);
          }),
        }
      );

      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          error: 'the previous error',
          status: 'READY',
          indexes: defaultSortedIndexes.slice(),
        },
      });

      await store.dispatch(pollRegularIndexes());
      expect(statusBeforeFetch).to.equal('POLLING');
      expect(store.getState().regularIndexes.status).to.equal('READY');
    });
  });

  describe('#failedIndexRemoved', function () {
    it('removes an in-progress index with the specified id', async function () {});
  });

  describe('#dropIndex (thunk)', function () {
    it('removes a failed in-progress index', async function () {
      const dropIndexSpy = sinon.spy();

      const store = await setupStoreAndWait(
        {},
        {
          indexes: () => Promise.resolve(indexesList),
          dropIndex: dropIndexSpy,
        }
      );

      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          inProgressIndexes: inProgressIndexes.map((_index) => {
            const index = {
              ..._index,
            };
            if (index.name === 'AAAA') {
              index.status = 'failed';
            }
            return index;
          }),
        },
      });

      let state = store.getState().regularIndexes;
      expect(state.inProgressIndexes.length).to.equal(inProgressIndexes.length);

      store.dispatch(dropFailedIndex('AAAA'));

      expect(dropIndexSpy.callCount).to.equal(0);

      state = store.getState().regularIndexes;

      expect(state.inProgressIndexes.length).to.equal(
        inProgressIndexes.length - 1
      );

      expect(state.inProgressIndexes[0].name).to.equal('z');
    });

    it('removes a real index', async function () {
      const dropIndexSpy = sinon.spy();

      const store = await setupStoreAndWait(
        {},
        {
          indexes: () => Promise.resolve(indexesList),
          dropIndex: dropIndexSpy,
        }
      );

      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          inProgressIndexes: inProgressIndexes.map((_index) => {
            const index = {
              ..._index,
            };
            return index;
          }),
        },
      });

      expect(dropIndexSpy.callCount).to.equal(0);
      await store.dispatch(dropIndex('BBBB')); // a real regular index. not in progress
      expect(dropIndexSpy.args).to.deep.equal([['citibike.trips', 'BBBB']]);
    });
  });

  describe('#hideIndex (thunk)', function () {
    it('hides an index', async function () {
      const updateCollection = sinon.spy();
      const store = await setupStoreAndWait(
        {},
        {
          indexes: () => Promise.resolve(indexesList),
          updateCollection,
        }
      );

      // fetch indexes so there's something to hide
      await store.dispatch(refreshRegularIndexes());

      expect(updateCollection.callCount).to.equal(0);
      await store.dispatch(hideIndex('BBBB'));

      expect(updateCollection.args).to.deep.equal([
        ['citibike.trips', { index: { hidden: true, name: 'BBBB' } }],
      ]);
    });
  });

  describe('#unhideIndex (thunk)', function () {
    it('unhides an index', async function () {
      const updateCollection = sinon.stub().resolves({});
      const store = await setupStoreAndWait(
        {},
        {
          indexes: () => Promise.resolve(indexesList),
          updateCollection,
        }
      );

      // fetch indexes so there's something to hide
      await store.dispatch(refreshRegularIndexes());

      await store.dispatch(unhideIndex('BBBB'));

      expect(updateCollection.args).to.deep.equal([
        ['citibike.trips', { index: { hidden: false, name: 'BBBB' } }],
      ]);
    });
  });

  describe('startPollingRegularIndexes and stopPollingRegularIndexes', function () {
    let clock: sinon.SinonFakeTimers;

    after(() => {
      clock.restore();
    });

    it('starts and stops the polling', async function () {
      const pollInterval = 5000;

      const collection = createMockCollection();

      const indexesStub = sinon.stub().resolves(indexesList);
      const store = await setupStoreAndWait(
        {},
        {
          indexes: indexesStub,
        },
        {
          collection,
        }
      );

      const waitForStatus = async (status: FetchStatus) => {
        await waitFor(() => {
          expect(store.getState().regularIndexes.status).to.eq(status);
        });
      };

      clock = sinon.useFakeTimers();

      expect(collection.fetch.callCount).to.equal(0);

      // before we start
      expect(store.getState().regularIndexes.status).to.equal('READY');

      // initial load
      expect(indexesStub.callCount).to.equal(1);

      store.dispatch(startPollingRegularIndexes());

      // poll
      clock.tick(pollInterval);
      await waitForStatus('POLLING');
      expect(indexesStub.callCount).to.equal(2);
      await waitForStatus('READY');

      // poll
      clock.tick(pollInterval);
      await waitForStatus('POLLING');
      expect(indexesStub.callCount).to.equal(3);
      await waitForStatus('READY');

      // stop
      store.dispatch(stopPollingRegularIndexes());

      // no more polling
      clock.tick(pollInterval);
      expect(indexesStub.callCount).to.equal(3);
      await waitForStatus('READY');

      // open again
      store.dispatch(startPollingRegularIndexes());

      // won't execute immediately
      expect(indexesStub.callCount).to.equal(3);
      await waitForStatus('READY');

      // does poll after the interval
      clock.tick(pollInterval);
      await waitForStatus('POLLING');
      expect(indexesStub.callCount).to.equal(4);
      await waitForStatus('READY');

      // and again
      clock.tick(pollInterval);
      await waitForStatus('POLLING');
      expect(indexesStub.callCount).to.equal(5);
      await waitForStatus('READY');

      // clean up
      store.dispatch(stopPollingRegularIndexes());

      expect(collection.fetch.callCount).to.equal(0);
    });
  });
});
