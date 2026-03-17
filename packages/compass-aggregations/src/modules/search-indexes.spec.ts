import { expect } from 'chai';
import reducer, { fetchIndexes, ActionTypes } from './search-indexes';
import configureStore from '../../test/configure-store';
import sinon from 'sinon';
import type { AnyAction } from 'redux';
import type { AggregationsStore } from '../stores/store';

describe('search-indexes module', function () {
  describe('#reducer', function () {
    it('returns default state', function () {
      expect(
        reducer(undefined, {
          type: 'test',
        } as any)
      ).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [],
        status: 'INITIAL',
      });
    });
    it('returns state when fetching starts (initial fetch)', function () {
      expect(
        reducer(undefined, {
          type: ActionTypes.FetchIndexesStarted,
          reason: 'INITIAL_FETCH',
        } as AnyAction)
      ).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [],
        status: 'LOADING',
      });
    });
    it('returns state when polling starts', function () {
      expect(
        reducer(undefined, {
          type: ActionTypes.FetchIndexesStarted,
          reason: 'POLL',
        } as AnyAction)
      ).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [],
        status: 'POLLING',
      });
    });

    it('returns state when fetching succeeds', function () {
      expect(
        reducer(undefined, {
          type: ActionTypes.FetchIndexesFinished,
          indexes: [{ name: 'default' }, { name: 'vector_index' }],
        } as AnyAction)
      ).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [{ name: 'default' }, { name: 'vector_index' }],
        status: 'READY',
      });
    });
    it('returns ERROR status when initial fetch fails', function () {
      // First set status to LOADING (initial fetch)
      const loadingState = reducer(undefined, {
        type: ActionTypes.FetchIndexesStarted,
        reason: 'INITIAL_FETCH',
      } as AnyAction);
      expect(
        reducer(loadingState, {
          type: ActionTypes.FetchIndexesFailed,
        })
      ).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [],
        status: 'ERROR',
      });
    });
    it('returns READY status when polling fails (keeps previous indexes)', function () {
      // First set status to POLLING
      const pollingState = reducer(
        {
          isSearchIndexesSupported: false,
          indexes: [{ name: 'existing' }] as any,
          status: 'POLLING',
        },
        {
          type: ActionTypes.FetchIndexesFailed,
        }
      );
      expect(pollingState).to.deep.equal({
        isSearchIndexesSupported: false,
        indexes: [{ name: 'existing' }],
        status: 'READY',
      });
    });
  });
  describe('#actions', function () {
    let getSearchIndexesStub: sinon.SinonStub;
    let sandbox: sinon.SinonSandbox;
    let store: AggregationsStore;
    beforeEach(async function () {
      sandbox = sinon.createSandbox();
      getSearchIndexesStub = sandbox.stub();
      store = (
        await configureStore(
          {
            pipeline: [],
            isSearchIndexesSupported: true,
            namespace: 'test.listings',
          },
          {
            getSearchIndexes: getSearchIndexesStub,
          } as any
        )
      ).plugin.store;
    });
    context('fetchIndexes', function () {
      it('fetches search indexes and sets status to READY', async function () {
        getSearchIndexesStub.callsFake((ns: string) => {
          expect(ns).to.equal('test.listings');
          return Promise.resolve([
            { name: 'default' },
            { name: 'vector_index' },
          ]);
        });

        await store.dispatch(fetchIndexes() as any);

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
          reason: 'INITIAL_FETCH',
        });

        await store.dispatch(fetchIndexes() as any);
        await store.dispatch(fetchIndexes() as any);
        await store.dispatch(fetchIndexes() as any);

        expect(getSearchIndexesStub.callCount).to.equal(0);
      });

      it('does not fetch indexes when status is READY', async function () {
        // Set the status to LOADING
        store.dispatch({
          type: ActionTypes.FetchIndexesFinished,
          indexes: [{ name: 'default' }, { name: 'vector_index' }] as any,
        });

        await store.dispatch(fetchIndexes() as any);
        await store.dispatch(fetchIndexes() as any);
        await store.dispatch(fetchIndexes() as any);

        expect(getSearchIndexesStub.callCount).to.equal(0);

        expect(store.getState().searchIndexes).to.deep.equal({
          isSearchIndexesSupported: true,
          indexes: [{ name: 'default' }, { name: 'vector_index' }],
          status: 'READY',
        });
      });

      it('sets ERROR status when fetching indexes fails', async function () {
        getSearchIndexesStub.callsFake((ns: string) => {
          expect(ns).to.equal('test.listings');
          return Promise.reject(new Error('Failed to fetch indexes'));
        });

        await store.dispatch(fetchIndexes() as any);

        expect(store.getState().searchIndexes).to.deep.equal({
          isSearchIndexesSupported: true,
          indexes: [],
          status: 'ERROR',
        });
      });

      it('fetches indexes in error state', async function () {
        // First set the status to LOADING, then fail to get ERROR state
        store.dispatch({
          type: ActionTypes.FetchIndexesStarted,
          reason: 'INITIAL_FETCH',
        });
        store.dispatch({
          type: ActionTypes.FetchIndexesFailed,
        });

        // Verify we're in ERROR state
        expect(store.getState().searchIndexes.status).to.equal('ERROR');

        getSearchIndexesStub.callsFake((ns: string) => {
          expect(ns).to.equal('test.listings');
          return Promise.resolve([
            { name: 'default' },
            { name: 'vector_index' },
          ]);
        });

        await store.dispatch(fetchIndexes() as any);

        expect(store.getState().searchIndexes).to.deep.equal({
          isSearchIndexesSupported: true,
          indexes: [{ name: 'default' }, { name: 'vector_index' }],
          status: 'READY',
        });
      });
    });
  });
});
