import { expect } from 'chai';
import type { Store } from 'redux';
import { SearchIndexesStatuses, setStatus } from './search-indexes';
import configureStore from '../stores/store';
import type { RootState } from '.';

describe('search-indexes module', function () {
  let store: Store<RootState>;

  beforeEach(function () {
    store = configureStore({ namespace: 'citibike.trips' });
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
});
