import { expect } from 'chai';
import { SearchIndexesStatuses, setStatus } from './search-indexes';
import { setupStore } from '../../test/setup-store';

describe('search-indexes module', function () {
  let store: ReturnType<typeof setupStore>;

  beforeEach(function () {
    store = setupStore();
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
