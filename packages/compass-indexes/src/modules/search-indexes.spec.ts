import { expect } from 'chai';
import {
  SearchIndexesStatuses,
  createSearchIndexClosed,
  createSearchIndexOpened,
  createIndex,
  refreshSearchIndexes,
  dropSearchIndex,
  updateSearchIndexOpened,
  updateSearchIndexClosed,
  updateIndex,
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
  let createSearchIndexStub: sinon.SinonStub;
  let updateSearchIndexStub: sinon.SinonStub;
  let getSearchIndexesStub: sinon.SinonStub;
  let dropSearchIndexStub: sinon.SinonStub;

  beforeEach(function () {
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

    store = setupStore(
      {
        namespace: 'citibike.trips',
        isSearchIndexesSupported: true,
      },
      dataProvider
    );
  });

  it('has not available search indexes state by default', function () {
    store = setupStore();
    expect(store.getState().searchIndexes.status).to.equal(
      SearchIndexesStatuses.NOT_AVAILABLE
    );
  });

  context('#refreshSearchIndexes action', function () {
    it('does nothing if isReadonlyView is true', function () {
      store.dispatch(readonlyViewChanged(true));

      expect(store.getState().isReadonlyView).to.equal(true);
      expect(getSearchIndexesStub.callCount).to.equal(0);

      store.dispatch(refreshSearchIndexes);

      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('NOT_READY');
    });

    it('does nothing if isWritable is false (offline mode)', function () {
      store.dispatch(writeStateChanged(false));

      expect(store.getState().isWritable).to.equal(false);
      expect(getSearchIndexesStub.callCount).to.equal(0);

      store.dispatch(refreshSearchIndexes);

      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('NOT_READY');
    });

    it('fetches the indexes', async function () {
      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('NOT_READY');

      await store.dispatch(refreshSearchIndexes());

      expect(getSearchIndexesStub.callCount).to.equal(1);
      expect(store.getState().searchIndexes.status).to.equal('READY');
    });

    it('sets the status to REFRESHING if the status is READY', async function () {
      expect(getSearchIndexesStub.callCount).to.equal(0);
      expect(store.getState().searchIndexes.status).to.equal('NOT_READY');

      await store.dispatch(refreshSearchIndexes());

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

    it('sets the status to ERROR if loading the indexes fails', async function () {
      // replace the stub
      getSearchIndexesStub.rejects(new Error('this is an error'));

      await store.dispatch(refreshSearchIndexes());

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
