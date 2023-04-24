import { expect } from 'chai';
import { EventEmitter } from 'events';
import { DEFAULT_QUERY_VALUES } from '../constants/query-bar-store';
import { setQuery } from './query-bar-reducer';
import configureStore from './query-bar-store';
import type AppRegistry from 'hadron-app-registry';

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

  describe('when localAppRegistry emits query-history-run-query', function () {
    it('should reset query to whatever was passed in the event', function () {
      const localAppRegistry = new EventEmitter() as unknown as AppRegistry;
      const initialQuery = { filter: { _id: 1 } };
      const store = configureStore({ query: initialQuery, localAppRegistry });
      expect(store.getCurrentQuery()).to.deep.eq({
        ...DEFAULT_QUERY_VALUES,
        ...initialQuery,
      });
      const newQuery = {
        filter: { _id: 2 },
        sort: { _id: -1 },
      };
      localAppRegistry.emit('query-history-run-query', newQuery);
      expect(store.getCurrentQuery()).to.deep.eq({
        ...DEFAULT_QUERY_VALUES,
        ...newQuery,
      });
    });
  });
});
