import { expect } from 'chai';
import { waitFor } from '@mongodb-js/testing-library-compass';
import type { FetchStatus } from '../utils/fetch-status';
import { FetchStatuses } from '../utils/fetch-status';
import {
  createSearchIndexClosed,
  createSearchIndexOpened,
  createIndex,
  refreshSearchIndexes,
  dropSearchIndex,
  updateSearchIndexOpened,
  updateSearchIndexClosed,
  updateIndex,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
} from './search-indexes';
import { setupStoreAndWait } from '../../test/setup-store';
import { searchIndexes } from '../../test/fixtures/search-indexes';
import sinon from 'sinon';
import type { IndexesDataService, IndexesStore } from '../stores/store';
import { readonlyViewChanged } from './is-readonly-view';

// Importing this to stub showConfirmation
import * as searchIndexesSlice from './search-indexes';
import { writeStateChanged } from './is-writable';

describe('search-indexes module', function () {
  let store: IndexesStore;
  let dataProvider: Partial<IndexesDataService>;
  let createSearchIndexStub: sinon.SinonStub;
  let updateSearchIndexStub: sinon.SinonStub;
  let getSearchIndexesStub: sinon.SinonStub;
  let dropSearchIndexStub: sinon.SinonStub;

  beforeEach(async function () {
    createSearchIndexStub = sinon.stub().resolves('foo');
    updateSearchIndexStub = sinon.stub().resolves();
    getSearchIndexesStub = sinon.stub().resolves(searchIndexes);
    dropSearchIndexStub = sinon.stub().resolves();
    dataProvider = {
      createSearchIndex: createSearchIndexStub,
      updateSearchIndex: updateSearchIndexStub,
      getSearchIndexes: getSearchIndexesStub,
      dropSearchIndex: dropSearchIndexStub,
    };

    store = await setupStoreAndWait(
      {
        namespace: 'citibike.trips',
        isSearchIndexesSupported: true,
      },
      dataProvider
    );
  });

  it('has not available search indexes state by default', async function () {
    store = await setupStoreAndWait({ isSearchIndexesSupported: false });
    expect(store.getState().searchIndexes.status).to.equal(
      FetchStatuses.NOT_READY
    );
  });

  context('#refreshSearchIndexes action', function () {
    it('does nothing if isReadonlyView is true', async function () {
      // already loaded once
      expect(store.getState().isReadonlyView).to.equal(false);
      expect(getSearchIndexesStub.callCount).to.equal(1);

      store.dispatch(readonlyViewChanged(true));

      expect(store.getState().isReadonlyView).to.equal(true);
      expect(getSearchIndexesStub.callCount).to.equal(1);

      await store.dispatch(refreshSearchIndexes());

      expect(getSearchIndexesStub.callCount).to.equal(1);
      expect(store.getState().searchIndexes.status).to.equal('READY');
    });

    it('does nothing if isWritable is false (offline mode)', async function () {
      // already loaded once
      expect(store.getState().isWritable).to.equal(true);
      expect(getSearchIndexesStub.callCount).to.equal(1);

      store.dispatch(writeStateChanged(false));

      expect(store.getState().isWritable).to.equal(false);
      expect(getSearchIndexesStub.callCount).to.equal(1);

      await store.dispatch(refreshSearchIndexes());

      expect(getSearchIndexesStub.callCount).to.equal(1);
      expect(store.getState().searchIndexes.status).to.equal('READY');
    });

    it('fetches the indexes', async function () {
      // already loaded once
      expect(store.getState().searchIndexes.status).to.equal('READY');
      expect(getSearchIndexesStub.callCount).to.equal(1);

      await store.dispatch(refreshSearchIndexes());

      expect(getSearchIndexesStub.callCount).to.equal(2);
      expect(store.getState().searchIndexes.status).to.equal('READY');
    });

    it('sets the status to REFRESHING if the status is READY', function () {
      expect(getSearchIndexesStub.callCount).to.equal(1);
      expect(store.getState().searchIndexes.status).to.equal('READY');

      // replace the stub
      getSearchIndexesStub.callsFake(() => {
        return new Promise(() => {
          // never resolves
        });
      });

      // not awaiting because REFRESHING happens during the action
      void store.dispatch(refreshSearchIndexes());

      expect(store.getState().searchIndexes.status).to.equal('REFRESHING');
    });

    it('loads the indexes', async function () {
      await store.dispatch(refreshSearchIndexes());
      const state = store.getState();
      expect(state.searchIndexes.indexes).to.deep.equal([
        {
          id: '1',
          name: 'default',
          status: 'READY',
          queryable: true,
          latestDefinition: {
            mappings: {
              dynamic: false,
            },
          },
        },
        {
          id: '2',
          name: 'another',
          status: 'FAILED',
          queryable: false,
          latestDefinition: {},
        },
      ]);
    });

    it('sets the status to ERROR if initial loading of the indexes fails', async function () {
      const getSearchIndexesStub = sinon
        .stub()
        .rejects(new Error('this is an error'));
      store = await setupStoreAndWait(undefined, {
        getSearchIndexes: getSearchIndexesStub,
      });

      expect(store.getState().searchIndexes.status).to.equal('ERROR');
      expect(store.getState().searchIndexes.error).to.equal('this is an error');
    });
  });

  context('create search index', function () {
    it('opens the modal for creation', function () {
      store.dispatch(createSearchIndexOpened());
      expect(store.getState().searchIndexes.createIndex.isModalOpen).to.be.true;
    });

    it('closes an open modal for creation', function () {
      store.dispatch(createSearchIndexOpened());
      store.dispatch(createSearchIndexClosed());
      expect(
        store.getState().searchIndexes.createIndex.isModalOpen
      ).to.be.false;
    });

    it('creates the index when data is valid', async function () {
      await store.dispatch(
        createIndex({ name: 'indexName', definition: {}, type: 'search' })
      );
      expect(
        store.getState().searchIndexes.createIndex.isModalOpen
      ).to.be.false;
      expect(dataProvider.createSearchIndex).to.have.been.calledOnce;
    });

    it('opens the search index view when an index is created', async function () {
      await store.dispatch(
        createIndex({
          name: 'indexName',
          definition: {},
          type: 'search',
        })
      );
      expect(store.getState().indexView).to.eq('search-indexes');
    });
  });

  context('update search index', function () {
    const UPDATE_INDEX = searchIndexes[0];
    beforeEach(async function () {
      await store.dispatch(refreshSearchIndexes());
      store.dispatch(updateSearchIndexOpened(UPDATE_INDEX.name));
    });
    it('closes an open modal for update', function () {
      store.dispatch(updateSearchIndexClosed());
      expect(
        store.getState().searchIndexes.updateIndex.isModalOpen
      ).to.be.false;
    });

    it('updates the index when data is valid and does not match existing definition', async function () {
      await store.dispatch(
        updateIndex({
          name: UPDATE_INDEX.name,
          definition: { something: 'else' },
          type: 'search',
        })
      );
      expect(
        store.getState().searchIndexes.updateIndex.isModalOpen
      ).to.be.false;
      expect(
        (dataProvider.updateSearchIndex as sinon.SinonSpy).callCount
      ).to.equal(1);
      expect(
        (dataProvider.updateSearchIndex as sinon.SinonSpy).firstCall.args
      ).to.deep.equal([
        'citibike.trips',
        UPDATE_INDEX.name,
        {
          something: 'else',
        },
      ]);
    });

    it('does not update the index when data is valid and matches existing definition', async function () {
      await store.dispatch(
        updateIndex({
          name: UPDATE_INDEX.name,
          definition: UPDATE_INDEX.latestDefinition,
          type: 'search',
        })
      );
      expect(
        store.getState().searchIndexes.updateIndex.isModalOpen
      ).to.be.false;
      expect(
        (dataProvider.updateSearchIndex as sinon.SinonSpy).callCount
      ).to.equal(0);
    });
  });

  context('drop search index', function () {
    let showConfirmationStub: sinon.SinonStub;
    beforeEach(function () {
      showConfirmationStub = sinon.stub(searchIndexesSlice, 'showConfirmation');
    });

    afterEach(function () {
      showConfirmationStub.restore();
    });

    it('does not drop index when user does not confirm', async function () {
      dropSearchIndexStub.resolves(false);
      await store.dispatch(dropSearchIndex('index_name'));
      expect(dropSearchIndexStub.callCount).to.equal(0);
    });

    it('drops index successfully', async function () {
      showConfirmationStub.resolves(true);
      dropSearchIndexStub.resolves(true);

      dropSearchIndexStub.resolves(true);
      await store.dispatch(dropSearchIndex('index_name'));
      expect(dropSearchIndexStub.firstCall.args).to.deep.equal([
        'citibike.trips',
        'index_name',
      ]);
      expect(store.getState().searchIndexes.error).to.be.undefined;
    });
  });

  describe('startPollingSearchIndexes and stopPollingSearchIndexes', function () {
    let clock: sinon.SinonFakeTimers;

    after(() => {
      clock.restore();
    });

    it('starts and stops the polling', async function () {
      const pollInterval = 5000;

      const getSearchIndexesStub = sinon.stub().resolves(searchIndexes);
      const store = await setupStoreAndWait(
        {
          isSearchIndexesSupported: true,
        },
        {
          getSearchIndexes: getSearchIndexesStub,
        }
      );

      clock = sinon.useFakeTimers();

      const waitForStatus = async (status: FetchStatus) => {
        await waitFor(() => {
          expect(store.getState().searchIndexes.status).to.eq(status);
        });
      };

      // before we start
      expect(store.getState().searchIndexes.status).to.equal('READY');

      // initial load
      expect(getSearchIndexesStub.callCount).to.equal(1);

      store.dispatch(startPollingSearchIndexes());

      // poll
      clock.tick(pollInterval);
      await waitForStatus('POLLING');
      expect(getSearchIndexesStub.callCount).to.equal(2);
      await waitForStatus('READY');

      // poll
      clock.tick(pollInterval);
      await waitForStatus('POLLING');
      expect(getSearchIndexesStub.callCount).to.equal(3);
      await waitForStatus('READY');

      // stop
      store.dispatch(stopPollingSearchIndexes());

      // no more polling
      clock.tick(pollInterval);
      expect(getSearchIndexesStub.callCount).to.equal(3);
      await waitForStatus('READY');

      // open again
      store.dispatch(startPollingSearchIndexes());

      // won't execute immediately
      expect(getSearchIndexesStub.callCount).to.equal(3);
      await waitForStatus('READY');

      // does poll after the interval
      clock.tick(pollInterval);
      await waitForStatus('POLLING');
      expect(getSearchIndexesStub.callCount).to.equal(4);
      await waitForStatus('READY');

      // and again
      clock.tick(pollInterval);
      await waitForStatus('POLLING');
      expect(getSearchIndexesStub.callCount).to.equal(5);
      await waitForStatus('READY');

      // clean up
      store.dispatch(stopPollingSearchIndexes());
    });
  });
});

describe('#getInitialVectorSearchIndexPipelineText', function () {
  it('returns pipeline text with the index name', function () {
    expect(
      searchIndexesSlice.getInitialVectorSearchIndexPipelineText('pineapple')
    ).to.include(`$vectorSearch: {
      // Name of the Atlas Vector Search index to use.
      index: "pineapple",`);
  });
});
