import { expect } from 'chai';
import reducer, { fetchIndexes, ActionTypes } from './search-indexes';
import configureStore from '../../test/configure-store';
import { DATA_SERVICE_CONNECTED } from './data-service';
import sinon from 'sinon';

describe('search-indexes module', function () {
  describe('#reducer', function () {
    it('returns default state', function () {
      expect(
        reducer(undefined, {
          type: 'test',
        })
      ).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [],
        status: 'INITIAL',
      });
    });
    it('returns state when fetching starts', function () {
      expect(
        reducer(undefined, {
          type: ActionTypes.FetchIndexesStarted,
        })
      ).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [],
        status: 'LOADING',
      });
    });
    it('returns state when fetching succeeds', function () {
      expect(
        reducer(undefined, {
          type: ActionTypes.FetchIndexesFinished,
          indexes: [{ name: 'default' }, { name: 'vector_index' }],
        })
      ).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [{ name: 'default' }, { name: 'vector_index' }],
        status: 'READY',
      });
    });
    it('returns state when fetching fails', function () {
      expect(
        reducer(undefined, {
          type: ActionTypes.FetchIndexesFailed,
        })
      ).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [],
        status: 'ERROR',
      });
    });
  });
  describe('#actions', function () {
    let store: ReturnType<typeof configureStore>;
    beforeEach(function () {
      store = configureStore({
        pipeline: [],
        isSearchIndexesSupported: true,
        namespace: 'test.listings',
      });
    });
    context('fetchIndexes', function () {
      it('fetches search indexes and sets status to READY', async function () {
        const spy = sinon.spy((ns: string) => {
          expect(ns).to.equal('test.listings');
          return Promise.resolve([
            { name: 'default' },
            { name: 'vector_index' },
          ]);
        });

        store.dispatch({
          type: DATA_SERVICE_CONNECTED,
          dataService: {
            getSearchIndexes: spy,
          },
        });

        await store.dispatch(fetchIndexes());

        expect(store.getState().searchIndexes).to.deep.equal({
          isSearchIndexesSupported: true,
          indexes: [{ name: 'default' }, { name: 'vector_index' }],
          status: 'READY',
        });
      });

      it('does not fetch indexes when status is LOADING', async function () {
        // Set the status to LOADING
        store.dispatch({
          type: ActionTypes.FetchIndexesStarted,
        });

        const spy = sinon.spy();
        store.dispatch({
          type: DATA_SERVICE_CONNECTED,
          dataService: {
            getSearchIndexes: spy,
          },
        });

        await store.dispatch(fetchIndexes());
        await store.dispatch(fetchIndexes());
        await store.dispatch(fetchIndexes());

        expect(spy.callCount).to.equal(0);
      });

      it('does not fetch indexes when status is READY', async function () {
        // Set the status to LOADING
        store.dispatch({
          type: ActionTypes.FetchIndexesFinished,
          indexes: [{ name: 'default' }, { name: 'vector_index' }],
        });

        const spy = sinon.spy();
        store.dispatch({
          type: DATA_SERVICE_CONNECTED,
          dataService: {
            getSearchIndexes: spy,
          },
        });

        await store.dispatch(fetchIndexes());
        await store.dispatch(fetchIndexes());
        await store.dispatch(fetchIndexes());

        expect(spy.callCount).to.equal(0);

        expect(store.getState().searchIndexes).to.deep.equal({
          isSearchIndexesSupported: true,
          indexes: [{ name: 'default' }, { name: 'vector_index' }],
          status: 'READY',
        });
      });

      it('sets ERROR status when fetching indexes fails', async function () {
        const spy = sinon.spy((ns: string) => {
          expect(ns).to.equal('test.listings');
          return Promise.reject(new Error('Failed to fetch indexes'));
        });

        store.dispatch({
          type: DATA_SERVICE_CONNECTED,
          dataService: {
            getSearchIndexes: spy,
          },
        });

        await store.dispatch(fetchIndexes());

        expect(store.getState().searchIndexes).to.deep.equal({
          isSearchIndexesSupported: true,
          indexes: [],
          status: 'ERROR',
        });
      });

      it('fetchs indexes in error state', async function () {
        // Set the status to ERROR
        store.dispatch({
          type: ActionTypes.FetchIndexesFailed,
        });

        const spy = sinon.spy((ns: string) => {
          expect(ns).to.equal('test.listings');
          return Promise.resolve([
            { name: 'default' },
            { name: 'vector_index' },
          ]);
        });

        store.dispatch({
          type: DATA_SERVICE_CONNECTED,
          dataService: {
            getSearchIndexes: spy,
          },
        });

        await store.dispatch(fetchIndexes());

        expect(store.getState().searchIndexes).to.deep.equal({
          isSearchIndexesSupported: true,
          indexes: [{ name: 'default' }, { name: 'vector_index' }],
          status: 'READY',
        });
      });
    });
  });
});
