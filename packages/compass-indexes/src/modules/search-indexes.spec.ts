import { expect } from 'chai';
import {
  SearchIndexesStatuses,
  closeModal,
  openModalForCreation,
  saveIndex,
  fetchSearchIndexes,
  sortSearchIndexes,
  dropSearchIndex,
} from './search-indexes';
import { setupStore } from '../../test/setup-store';
import { searchIndexes } from '../../test/fixtures/search-indexes';
import sinon from 'sinon';
import type { IndexesDataService } from '../stores/store';
import { readonlyViewChanged } from './is-readonly-view';

// Importing this to stub showConfirmation
import * as searchIndexesSlice from './search-indexes';

describe('search-indexes module', function () {
  let store: ReturnType<typeof setupStore>;
  let dataProvider: Partial<IndexesDataService>;
  let getSearchIndexesStub: any;

  beforeEach(function () {
    dataProvider = {
      createSearchIndex: sinon.spy(),
    };

    store = setupStore(
      {
        isSearchIndexesSupported: true,
      },
      dataProvider
    );

    getSearchIndexesStub = sinon
      .stub(
        store.getState().dataService as IndexesDataService,
        'getSearchIndexes'
      )
      .resolves(searchIndexes);
  });

  it('has not available search indexes state by default', function () {
    store = setupStore();
    expect(store.getState().searchIndexes.status).to.equal(
      SearchIndexesStatuses.NOT_AVAILABLE
    );
  });

  context('#fetchSearchIndexes action', function () {
    it('does nothing if isReadonlyView is true', function () {
      store.dispatch(readonlyViewChanged(true));

      expect(store.getState().isReadonlyView).to.equal(true);
      expect(getSearchIndexesStub.callCount).to.equal(0);

      store.dispatch(fetchSearchIndexes);

      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('PENDING');
    });

    it('does nothing if there is no dataService', function () {
      store.getState().dataService = null;
      store.dispatch(fetchSearchIndexes);
      // would throw if it tried to use it
    });

    it('fetches the indexes', async function () {
      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('PENDING');

      await store.dispatch(fetchSearchIndexes());

      expect(getSearchIndexesStub.callCount).to.equal(1);
      expect(store.getState().searchIndexes.status).to.equal('READY');
    });

    it('sets the status to REFRESHING if the status is READY', async function () {
      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('PENDING');

      await store.dispatch(fetchSearchIndexes());

      expect(getSearchIndexesStub.callCount).to.equal(1);
      expect(store.getState().searchIndexes.status).to.equal('READY');

      // replace the stub
      getSearchIndexesStub.restore();
      getSearchIndexesStub = sinon
        .stub(
          store.getState().dataService as IndexesDataService,
          'getSearchIndexes'
        )
        .callsFake(() => {
          return new Promise(() => {
            // never resolves
          });
        });

      // not awaiting because REFRESHING happens during the action
      void store.dispatch(fetchSearchIndexes());

      expect(store.getState().searchIndexes.status).to.equal('REFRESHING');
    });

    it('loads and sorts the indexes', async function () {
      await store.dispatch(fetchSearchIndexes());
      const state = store.getState();
      expect(state.searchIndexes.indexes).to.deep.equal([
        {
          id: '2',
          name: 'another',
          status: 'FAILED',
          queryable: false,
          latestDefinition: {},
        },
        {
          id: '1',
          name: 'default',
          status: 'READY',
          queryable: true,
          latestDefinition: {},
        },
      ]);
      expect(state.searchIndexes.sortColumn).to.equal('Name and Fields');
      expect(state.searchIndexes.sortOrder).to.equal('asc');
    });

    it('sets the status to ERROR if loading the indexes fails', async function () {
      // replace the stub
      getSearchIndexesStub.restore();
      getSearchIndexesStub = sinon
        .stub(
          store.getState().dataService as IndexesDataService,
          'getSearchIndexes'
        )
        .rejects(new Error('this is an error'));

      await store.dispatch(fetchSearchIndexes());

      expect(store.getState().searchIndexes.status).to.equal('ERROR');
      expect(store.getState().searchIndexes.error).to.equal('this is an error');
    });
  });

  context('#sortSearchIndexes action', function () {
    it('sorts the indexes as specified', async function () {
      await store.dispatch(fetchSearchIndexes());
      let state = store.getState();

      expect(state.searchIndexes.sortColumn).to.equal('Name and Fields');
      expect(state.searchIndexes.sortOrder).to.equal('asc');

      store.dispatch(sortSearchIndexes('Status', 'desc'));

      state = store.getState();

      expect(state.searchIndexes.sortColumn).to.equal('Status');
      expect(state.searchIndexes.sortOrder).to.equal('desc');

      expect(state.searchIndexes.indexes).to.deep.equal([
        {
          id: '1',
          name: 'default',
          status: 'READY',
          queryable: true,
          latestDefinition: {},
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
  });

  it('opens the modal for creation', function () {
    store.dispatch(openModalForCreation());
    expect(store.getState().searchIndexes.createIndex.isModalOpen).to.be.true;
  });

  it('closes an open modal', function () {
    store.dispatch(openModalForCreation());
    store.dispatch(closeModal());
    expect(store.getState().searchIndexes.createIndex.isModalOpen).to.be.false;
  });

  it('creates the index when data is valid', async function () {
    await store.dispatch(saveIndex('indexName', {}));
    expect(store.getState().searchIndexes.createIndex.isModalOpen).to.be.false;
    expect(dataProvider.createSearchIndex).to.have.been.calledOnce;
  });

  context('drop search index', function () {
    let dropSearchIndexStub: sinon.SinonStub;
    let showConfirmationStub: sinon.SinonStub;
    beforeEach(function () {
      dropSearchIndexStub = sinon.stub(
        store.getState().dataService as IndexesDataService,
        'dropSearchIndex'
      );
      showConfirmationStub = sinon.stub(searchIndexesSlice, 'showConfirmation');
    });

    afterEach(function () {
      showConfirmationStub.restore();
      dropSearchIndexStub.restore();
    });

    it('does not drop index when user does not confirm', async function () {
      showConfirmationStub.resolves(false);
      await store.dispatch(dropSearchIndex('index_name'));
      expect(dropSearchIndexStub.callCount).to.equal(0);
    });

    it('drops index successfully', async function () {
      showConfirmationStub.resolves(true);
      dropSearchIndexStub.resolves(true);
      await store.dispatch(dropSearchIndex('index_name'));
      expect(dropSearchIndexStub.firstCall.args).to.deep.equal([
        'citibike.trips',
        'index_name',
      ]);
      expect(store.getState().searchIndexes.error).to.be.undefined;
    });
  });
});
