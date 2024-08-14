import { expect } from 'chai';
import reducer, { fetchIndexes, ActionTypes } from './search-indexes';
import configureStore from '../../test/configure-store';
import sinon from 'sinon';
import type { AnyAction } from 'redux';

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
        } as AnyAction)
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
    let getSearchIndexesStub: sinon.SinonStub;
    let sandbox: sinon.SinonSandbox;
    let store: ReturnType<typeof configureStore>;
    beforeEach(function () {
      sandbox = sinon.createSandbox();
      getSearchIndexesStub = sandbox.stub();
      store = configureStore(
        {
          pipeline: [],
          isSearchIndexesSupported: true,
          namespace: 'test.listings',
        },
        {
          getSearchIndexes: getSearchIndexesStub,
        } as any
      );
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

      it('fetchs indexes in error state', async function () {
        // Set the status to ERROR
        store.dispatch({
          type: ActionTypes.FetchIndexesFailed,
        });

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
