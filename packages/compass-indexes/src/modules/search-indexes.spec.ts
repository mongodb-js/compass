import { expect } from 'chai';
import {
  SearchIndexesStatuses,
  closeCreateModal,
  showCreateModal,
  createIndex,
  refreshSearchIndexes as fetchSearchIndexes,
  sortSearchIndexes,
  dropSearchIndex,
  showUpdateModal,
  closeUpdateModal,
  updateIndex,
  runAggregateSearchIndex,
} from './search-indexes';
import { setupStore } from '../../test/setup-store';
import { searchIndexes } from '../../test/fixtures/search-indexes';
import sinon from 'sinon';
import type { IndexesDataService } from '../stores/store';
import { readonlyViewChanged } from './is-readonly-view';

// Importing this to stub showConfirmation
import * as searchIndexesSlice from './search-indexes';
import { writeStateChanged } from './is-writable';

describe('search-indexes module', function () {
  let store: ReturnType<typeof setupStore>;
  let dataProvider: Partial<IndexesDataService>;
  let getSearchIndexesStub: any;

  beforeEach(function () {
    dataProvider = {
      createSearchIndex: sinon.spy(),
      updateSearchIndex: sinon.spy(),
    };

    store = setupStore(
      {
        namespace: 'citibike.trips',
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
      expect(store.getState().searchIndexes.status).to.equal('NOT_READY');
    });

    it('does nothing if isWritable is false (offline mode)', function () {
      store.dispatch(writeStateChanged(false));

      expect(store.getState().isWritable).to.equal(false);
      expect(getSearchIndexesStub.callCount).to.equal(0);

      store.dispatch(fetchSearchIndexes);

      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('NOT_READY');
    });

    it('does nothing if there is no dataService', function () {
      store.getState().dataService = null;
      store.dispatch(fetchSearchIndexes);
      // would throw if it tried to use it
    });

    it('fetches the indexes', async function () {
      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('NOT_READY');

      await store.dispatch(fetchSearchIndexes());

      expect(getSearchIndexesStub.callCount).to.equal(1);
      expect(store.getState().searchIndexes.status).to.equal('READY');
    });

    it('sets the status to REFRESHING if the status is READY', async function () {
      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('NOT_READY');

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
          latestDefinition: {
            mappings: {
              dynamic: false,
            },
          },
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
  });

  context('create search index', function () {
    it('opens the modal for creation', function () {
      store.dispatch(showCreateModal());
      expect(store.getState().searchIndexes.createIndex.isModalOpen).to.be.true;
    });

    it('closes an open modal for creation', function () {
      store.dispatch(showCreateModal());
      store.dispatch(closeCreateModal());
      expect(
        store.getState().searchIndexes.createIndex.isModalOpen
      ).to.be.false;
    });

    it('creates the index when data is valid', async function () {
      await store.dispatch(createIndex('indexName', {}));
      expect(
        store.getState().searchIndexes.createIndex.isModalOpen
      ).to.be.false;
      expect(dataProvider.createSearchIndex).to.have.been.calledOnce;
    });

    it('opens the search index view when an index is created', async function () {
      await store.dispatch(createIndex('indexName', {}));
      expect(store.getState().indexView).to.eq('search-indexes');
    });
  });

  context('update search index', function () {
    const UPDATE_INDEX = searchIndexes[0];
    beforeEach(async function () {
      await store.dispatch(fetchSearchIndexes());
      store.dispatch(showUpdateModal(UPDATE_INDEX.name));
    });
    it('closes an open modal for update', function () {
      store.dispatch(closeUpdateModal());
      expect(
        store.getState().searchIndexes.updateIndex.isModalOpen
      ).to.be.false;
    });

    it('updates the index when data is valid and does not match existing definition', async function () {
      await store.dispatch(
        updateIndex(UPDATE_INDEX.name, { something: 'else' })
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
        updateIndex(UPDATE_INDEX.name, UPDATE_INDEX.latestDefinition)
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

  it('runs aggreate for a search index', async function () {
    const emitSpy = sinon.spy();
    const store = setupStore(
      {
        isSearchIndexesSupported: true,
        globalAppRegistry: {
          on: sinon.spy(),
          getStore: sinon.spy(),
          emit: emitSpy,
        } as any,
      },
      {
        isConnected: () => true,
        getSearchIndexes: () => Promise.resolve(searchIndexes),
      }
    );

    await store.dispatch(fetchSearchIndexes());

    store.dispatch(runAggregateSearchIndex('default'));

    expect(emitSpy.callCount).to.deep.equal(1);
    const callArgs = emitSpy.firstCall.args;
    expect(callArgs[0]).to.equal('search-indexes-run-aggregate');
    expect(callArgs[1]).to.have.property('ns');
    expect(callArgs[1]).to.have.property('pipelineText');
  });
});
