import { expect } from 'chai';
import { SearchIndexesStatuses } from './search-indexes';
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

  context('#fetchSearchIndexes action', function () {
    it('does nothing if isReadonlyView is true');
    it('leaves the status at PENDING');
    it('does nothing if there is no dataService');
    it('sets the status to REFRESHING if the status is READY');
    it('loads and sorts the indexes');
    it('takes the existing order into account');
    it('sets the status to ERROR if loading the indexes fails');
  });

  context('#sortSearchIndexes action', function () {
    it('can sort by name ascending');
    it('can sort by name descending');
    it('can sort by status ascending');
    it('can sort by status descending');
  });
});
