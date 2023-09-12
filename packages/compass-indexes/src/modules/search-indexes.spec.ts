import { expect } from 'chai';
import {
  SearchIndexesStatuses,
  closeModal,
  openModalForCreation,
  saveIndex,
  setError,
  setStatus,
} from './search-indexes';
import { setupStore } from '../../test/setup-store';
import sinon from 'sinon';
import type { IndexesDataService } from '../stores/store';

describe('search-indexes module', function () {
  let store: ReturnType<typeof setupStore>;
  let dataProvider: Partial<IndexesDataService>;

  beforeEach(function () {
    dataProvider = {
      createSearchIndex: sinon.spy(),
    };

    store = setupStore({ options: {}, dataProvider });
  });

  it('has not available search indexes state by default', function () {
    expect(store.getState().searchIndexes.status).to.equal(
      SearchIndexesStatuses.NOT_AVAILABLE
    );
  });

  it('sets the status of the search indexes', function () {
    store.dispatch(setStatus(SearchIndexesStatuses.PENDING));
    expect(store.getState().searchIndexes.status).to.equal(
      SearchIndexesStatuses.PENDING
    );
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

  it('sets server errors', function () {
    store.dispatch(setError('Something funny happened.'));
    expect(store.getState().searchIndexes.error).to.equal(
      'Something funny happened.'
    );
  });

  it('creates the index when data is valid', function () {
    store.dispatch(saveIndex('indexName', {}));
    expect(store.getState().searchIndexes.createIndex.isModalOpen).to.be.false;
    expect(dataProvider.createSearchIndex).to.have.been.calledOnce;
  });
});
