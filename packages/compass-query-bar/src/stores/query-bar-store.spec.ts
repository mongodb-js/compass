import { expect } from 'chai';
import { DEFAULT_QUERY_VALUES } from '../constants/query-bar-store';
import { setQuery } from './query-bar-reducer';
import configureStore from './query-bar-store';

describe('QueryBarStore [Store]', function () {
  describe('getCurrentQuery', function () {
    it('returns current query values from state', function () {
      const store = configureStore();
      expect(store.getCurrentQuery()).to.deep.eq(DEFAULT_QUERY_VALUES);
      const newQuery = {
        filter: { _id: '123' },
        sort: { _id: 1 },
        limit: 1000,
      };
      store.dispatch(setQuery(newQuery));
      expect(store.getCurrentQuery()).to.deep.eq({
        ...DEFAULT_QUERY_VALUES,
        ...newQuery,
      });
    });
  });
});
